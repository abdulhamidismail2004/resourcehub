import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  detectedMime: string;
  extension: string;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export class FileValidatorService {
  static readonly ALLOWED_EXTENSIONS = new Set([
    'pdf',
    'pptx',
    'ppt',
    'docx',
    'doc',
    'xlsx',
    'xls',
    'jpg',
    'jpeg',
    'png',
    'webp',
  ]);

  static sanitizeFileName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const base = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);
    return `${base || 'document'}${ext}`;
  }

  static validateFileSignature(buffer: Buffer, originalName: string, claimedMime: string): ValidationResult {
    const ext = path.extname(originalName).toLowerCase().replace(/^\./, '');

    if (!this.ALLOWED_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        detectedMime: claimedMime,
        extension: ext,
        error: `File format .${ext} is not supported. Supported formats: PDF, PPTX, DOCX, XLSX, JPG, PNG, WebP.`,
      };
    }

    if (buffer.length === 0) {
      return {
        isValid: false,
        detectedMime: claimedMime,
        extension: ext,
        error: 'Uploaded file is empty.',
      };
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return {
        isValid: false,
        detectedMime: claimedMime,
        extension: ext,
        error: `File exceeds maximum allowed size of 50MB. (Current: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`,
      };
    }

    // Inspect magic bytes
    let detectedMime = claimedMime;

    // PDF signature: %PDF-
    if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      detectedMime = 'application/pdf';
    }
    // ZIP / Office OpenXML (docx, pptx, xlsx): PK\x03\x04
    else if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      if (ext === 'docx') detectedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === 'pptx') detectedMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (ext === 'xlsx') detectedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else detectedMime = 'application/zip';
    }
    // JPEG: \xFF\xD8\xFF
    else if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      detectedMime = 'image/jpeg';
    }
    // PNG: \x89PNG\r\n\x1a\n
    else if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      detectedMime = 'image/png';
    }
    // WebP: RIFF....WEBP
    else if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      detectedMime = 'image/webp';
    }
    // Legacy Office OLE: \xD0\xCF\x11\xE0
    else if (buffer.length >= 4 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
      if (ext === 'doc') detectedMime = 'application/msword';
      else if (ext === 'ppt') detectedMime = 'application/vnd.ms-powerpoint';
      else if (ext === 'xls') detectedMime = 'application/vnd.ms-excel';
    } else {
      // If none matched and extension is PDF or images, fail validation
      if (['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        return {
          isValid: false,
          detectedMime,
          extension: ext,
          error: `File signature mismatch for .${ext}. The file content does not match its claimed extension.`,
        };
      }
    }

    return {
      isValid: true,
      detectedMime,
      extension: ext,
    };
  }
}
