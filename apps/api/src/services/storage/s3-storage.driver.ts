import { IStorageDriver } from './storage.interface.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface S3DriverOptions {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle?: boolean;
}

export class S3StorageDriver implements IStorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor(options: S3DriverOptions) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      credentials: {
        accessKeyId: options.accessKey,
        secretAccessKey: options.secretKey,
      },
      forcePathStyle: options.forcePathStyle ?? true,
    });
  }

  async upload(key: string, streamOrBuffer: Readable | Buffer, mimeType: string): Promise<{ storageKey: string; size: number }> {
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

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
      })
    );

    return { storageKey: key, size: body.length };
  }

  async getStream(key: string): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    return response.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}
