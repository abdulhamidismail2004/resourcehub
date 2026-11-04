import { config } from '../../config/env.js';
import { IStorageDriver } from './storage.interface.js';
import { LocalStorageDriver } from './local-storage.driver.js';
import { S3StorageDriver } from './s3-storage.driver.js';
import { VercelBlobDriver } from './vercel-blob.driver.js';
import path from 'path';

let storageInstance: IStorageDriver | null = null;

export function getStorageDriver(): IStorageDriver {
  if (storageInstance) return storageInstance;

  // 1. Vercel Blob Storage
  if (process.env.BLOB_READ_WRITE_TOKEN || config.storageDriver === ('vercel-blob' as any)) {
    console.log('Initializing Vercel Blob Storage Driver...');
    storageInstance = new VercelBlobDriver();
    return storageInstance;
  }

  // 2. S3 / Cloudflare R2 / Supabase Storage
  if (config.storageDriver === 's3' && config.s3.endpoint) {
    console.log('Initializing S3/MinIO/Cloudflare R2 Storage Driver with bucket:', config.s3.bucket);
    storageInstance = new S3StorageDriver({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      bucket: config.s3.bucket,
      accessKey: config.s3.accessKey,
      secretKey: config.s3.secretKey,
      forcePathStyle: config.s3.forcePathStyle,
    });
    return storageInstance;
  }

  // 3. Local Disk (supports /tmp in serverless)
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const targetDir = isServerless ? '/tmp/uploads' : config.storageLocalDir;
  console.log(`Initializing Local Storage Driver at: ${targetDir} (isServerless: ${isServerless})`);
  storageInstance = new LocalStorageDriver(targetDir);
  return storageInstance;
}
