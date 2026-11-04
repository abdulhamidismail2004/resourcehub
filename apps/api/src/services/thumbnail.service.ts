import sharp from 'sharp';
import { getStorageDriver } from './storage/index.js';

export class ThumbnailService {
  static async generateThumbnail(
    fileBuffer: Buffer,
    mimeType: string,
    resourceId: string
  ): Promise<string | null> {
    try {
      if (['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        const thumbBuffer = await sharp(fileBuffer)
          .resize({ width: 600, height: 400, fit: 'cover', position: 'center' })
          .webp({ quality: 80 })
          .toBuffer();

        const storage = getStorageDriver();
        const thumbKey = `thumb-${resourceId}.webp`;
        await storage.upload(thumbKey, thumbBuffer, 'image/webp');
        return `/api/resources/thumbnail/${thumbKey}`;
      }
    } catch (err) {
      console.warn('Thumbnail generation failed:', (err as Error).message);
    }
    return null;
  }
}
