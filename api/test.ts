export default async function handler(req: any, res: any) {
  const diagnostics: any = {
    time: new Date().toISOString(),
    nodeVersion: process.version,
    cwd: process.cwd(),
    env: {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      DEMO_MODE: process.env.DEMO_MODE,
      STORAGE_DRIVER: process.env.STORAGE_DRIVER,
      BLOB_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    },
    tests: {}
  };

  // Test 1: Config env
  try {
    const { config } = await import('../apps/api/src/config/env.js');
    diagnostics.tests.config = 'OK: nodeEnv=' + config.nodeEnv;
  } catch (e: any) {
    diagnostics.tests.config = 'FAIL: ' + e.message + ' | ' + e.stack;
  }

  // Test 2: Storage Driver
  try {
    const { getStorageDriver } = await import('../apps/api/src/services/storage/index.js');
    const storage = getStorageDriver();
    diagnostics.tests.storage = 'OK: ' + storage.constructor.name;
  } catch (e: any) {
    diagnostics.tests.storage = 'FAIL: ' + e.message;
  }

  // Test 3: DB / PGlite
  try {
    const { getDb } = await import('../apps/api/src/db/index.js');
    const db = await getDb();
    diagnostics.tests.db = 'OK: ' + typeof db;
  } catch (e: any) {
    diagnostics.tests.db = 'FAIL: ' + e.message + ' | ' + e.stack;
  }

  // Test 4: App Build
  try {
    const { buildApp } = await import('../apps/api/src/app.js');
    const app = await buildApp();
    diagnostics.tests.app = 'OK: ' + typeof app;
  } catch (e: any) {
    diagnostics.tests.app = 'FAIL: ' + e.message + ' | ' + e.stack;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(diagnostics, null, 2));
}
