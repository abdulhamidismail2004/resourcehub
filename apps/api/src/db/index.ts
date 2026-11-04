import { config } from '../config/env.js';
import * as schema from './schema/index.js';
import path from 'path';
import fs from 'fs';

let dbInstance: any = null;
let pgliteClient: any = null;
let pgPool: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const isPostgresUrl = config.databaseUrl && config.databaseUrl.startsWith('postgres');

  if (isPostgresUrl) {
    try {
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const pg = await import('pg');
      const { Pool } = pg.default || pg;

      pgPool = new Pool({
        connectionString: config.databaseUrl,
      });

      // Quick test query to ensure connection is alive
      await pgPool.query('SELECT 1');
      console.log('Connected to PostgreSQL database at', config.databaseUrl.replace(/:[^:@]*@/, ':****@'));
      dbInstance = drizzle(pgPool, { schema });
      return dbInstance;
    } catch (err) {
      console.warn('PostgreSQL connection failed or not reachable. Falling back to embedded PGlite...', (err as Error).message);
    }
  }

  // Fallback to embedded PGlite (Real PostgreSQL in Node.js/WASM)
  const { drizzle } = await import('drizzle-orm/pglite');
  const { PGlite } = await import('@electric-sql/pglite');

  const dataDir = path.resolve(process.cwd(), '.data/pglite');
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
