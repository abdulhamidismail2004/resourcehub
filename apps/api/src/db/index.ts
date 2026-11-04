import { config } from '../config/env.js';
import * as schema from './schema/index.js';
import path from 'path';
import fs from 'fs';

let dbInstance: any = null;
let pgliteClient: any = null;
let pgPool: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const isPostgresUrl = config.databaseUrl && (config.databaseUrl.startsWith('postgres://') || config.databaseUrl.startsWith('postgresql://'));

  if (isPostgresUrl) {
    try {
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const pg = await import('pg');
      const { Pool } = pg.default || pg;

      const needsSsl = config.databaseUrl.includes('neon.tech') ||
                       config.databaseUrl.includes('supabase.co') ||
                       config.databaseUrl.includes('sslmode=require') ||
                       process.env.NODE_ENV === 'production';

      pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test connectivity
      await pgPool.query('SELECT 1');
      console.log('Connected to PostgreSQL database at:', config.databaseUrl.replace(/:[^:@]*@/, ':****@'));
      dbInstance = drizzle(pgPool, { schema });
      return dbInstance;
    } catch (err) {
      console.warn('PostgreSQL connection failed. Falling back to embedded PGlite...', (err as Error).message);
    }
  }

  // Fallback to embedded PGlite (Real PostgreSQL in Node.js/WASM)
  const { drizzle } = await import('drizzle-orm/pglite');
  const { PGlite } = await import('@electric-sql/pglite');

  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const dataDir = isServerless ? '/tmp/pglite' : path.resolve(process.cwd(), '.data/pglite');
  fs.mkdirSync(dataDir, { recursive: true });

  pgliteClient = new PGlite(dataDir);
  console.log('Using embedded PostgreSQL (PGlite) stored at:', dataDir);
  dbInstance = drizzle(pgliteClient, { schema });
  return dbInstance;
}

export async function closeDb() {
  if (pgPool) {
    await pgPool.end();
  }
  if (pgliteClient) {
    await pgliteClient.close();
  }
  dbInstance = null;
}
