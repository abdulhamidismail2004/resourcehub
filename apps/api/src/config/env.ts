import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or apps/api
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  webUrl: process.env.WEB_URL || 'http://localhost:5173',

  databaseUrl: process.env.DATABASE_URL || 'local',

  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-key-at-least-32-chars-long-security',
  cookieSecret: process.env.COOKIE_SECRET || 'dev-cookie-secret-key-at-least-32-chars-long-security',

  storageDriver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
  storageLocalDir: path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './uploads'),

  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'resourcehub',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  },

  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL || 'admin@resourcehub.edu',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!',
  },
};
