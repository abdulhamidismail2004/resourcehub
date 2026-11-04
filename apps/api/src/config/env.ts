import dotenv from 'dotenv';
import path from 'path';

// Safely load .env in development without crashing in serverless/bundled environments
if (!process.env.VERCEL) {
  try {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    dotenv.config();
  } catch {
    // Ignored in bundled environments
  }
}

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDemoMode: process.env.DEMO_MODE === 'true' || true,
  apiUrl: process.env.API_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000'),
  webUrl: process.env.WEB_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'),

  databaseUrl: process.env.DATABASE_URL || 'local',

  sessionSecret: process.env.SESSION_SECRET || 'resourcehub-demo-session-secret-key-32-chars-min',
  cookieSecret: process.env.COOKIE_SECRET || 'resourcehub-demo-cookie-secret-key-32-chars-min',

  storageDriver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3' | 'vercel-blob',
  storageLocalDir: isServerless ? '/tmp/uploads' : path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './uploads'),

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
