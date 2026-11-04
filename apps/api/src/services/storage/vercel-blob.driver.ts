import { IStorageDriver } from './storage.interface.js';
import { put, del, head } from '@vercel/blob';
import { Readable } from 'stream';

export class VercelBlobDriver implements IStorageDriver {
  private token?: string;

  constructor(token?: string) {
    this.token = token || process.env.BLOB_READ_WRITE_TOKEN;
  }

  async upload(
    key: string,
    streamOrBuffer: Readable | Buffer,
    mimeType: string
  ): Promise<{ storageKey: string; size: number }> {
    let body: Buffer;
    if (Buffer.isBuffer(streamOrBuffer)) {
      body = streamOrBuffer;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of streamOrBuffer) {
        chunks.push(Buffer.from(chunk));
      }
      body = Buffer.concat(chunks);
    }

    const blob = await put(key, body, {
      access: 'public',
      contentType: mimeType,
      token: this.token,
    });

    return { storageKey: blob.url, size: body.length };
  }

  async getStream(keyOrUrl: string): Promise<Readable> {
    // If keyOrUrl is a Vercel Blob URL, fetch it and return stream
    const url = keyOrUrl.startsWith('http') ? keyOrUrl : keyOrUrl;
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to stream blob file from ${url}`);
    }
    // Convert Web ReadableStream to Node.js Readable
    const reader = response.body.getReader();
    const nodeStream = new Readable({
      async read() {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          this.push(Buffer.from(value));
        }
      },
    });
    return nodeStream;
  }

  async delete(keyOrUrl: string): Promise<void> {
    if (keyOrUrl.startsWith('http')) {
      await del(keyOrUrl, { token: this.token });
    }
  }

  async exists(keyOrUrl: string): Promise<boolean> {
    try {
      if (keyOrUrl.startsWith('http')) {
        const info = await head(keyOrUrl, { token: this.token });
        return !!info;
      }
      return false;
    } catch {
      return false;
    }
  }
}
