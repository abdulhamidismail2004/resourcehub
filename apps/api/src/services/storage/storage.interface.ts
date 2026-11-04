import { Readable } from 'stream';

export interface IStorageDriver {
  upload(key: string, streamOrBuffer: Readable | Buffer, mimeType: string): Promise<{ storageKey: string; size: number }>;
  getStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
