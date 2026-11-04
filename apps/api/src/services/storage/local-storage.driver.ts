import { IStorageDriver } from './storage.interface.js';
import fs from 'fs';
import path from 'path';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';

const pipe = promisify(pipeline);

export class LocalStorageDriver implements IStorageDriver {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    // Prevent directory traversal attacks
    const sanitizedKey = path.basename(key);
    const resolvedPath = path.resolve(this.baseDir, sanitizedKey);
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Invalid storage key path traversal detected.');
    }
    return resolvedPath;
  }

  async upload(key: string, streamOrBuffer: Readable | Buffer, _mimeType: string): Promise<{ storageKey: string; size: number }> {
    const targetPath = this.resolveSafePath(key);

    if (Buffer.isBuffer(streamOrBuffer)) {
      await fs.promises.writeFile(targetPath, streamOrBuffer);
      return { storageKey: key, size: streamOrBuffer.length };
    } else {
      const writeStream = fs.createWriteStream(targetPath);
      await pipe(streamOrBuffer, writeStream);
      const stat = await fs.promises.stat(targetPath);
      return { storageKey: key, size: stat.size };
    }
  }

  async getStream(key: string): Promise<Readable> {
    const targetPath = this.resolveSafePath(key);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File not found in storage: ${key}`);
    }
    return fs.createReadStream(targetPath);
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.resolveSafePath(key);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
  }

  async exists(key: string): Promise<boolean> {
    const targetPath = this.resolveSafePath(key);
    return fs.existsSync(targetPath);
  }
}
