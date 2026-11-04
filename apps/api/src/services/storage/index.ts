import { config } from '../../config/env.js';
import { IStorageDriver } from './storage.interface.js';
import { LocalStorageDriver } from './local-storage.driver.js';
import { S3StorageDriver } from './s3-storage.driver.js';

let storageInstance: IStorageDriver | null = null;

export function getStorageDriver(): IStorageDriver {
  if (storageInstance) return storageInstance;

  if (config.storageDriver === 's3' && config.s3.endpoint) {
    console.log('Initializing S3/MinIO Storage Driver with bucket:', config.s3.bucket);
    storageInstance = new S3StorageDriver({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      bucket: config.s3.bucket,
      accessKey: config.s3.accessKey,
      secretKey: config.s3.secretKey,
      forcePathStyle: config.s3.forcePathStyle,
    });
  } else {
    console.log('Initializing Local Disk Storage Driver at:', config.storageLocalDir);
    storageInstance = new LocalStorageDriver(config.storageLocalDir);
  }

  return storageInstance;
}
