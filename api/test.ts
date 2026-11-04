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
    const { config } = await import('../apps/api/dist/config/env.js');
    diagnostics.tests.config = 'OK: nodeEnv=' + config.nodeEnv;
  } catch (e: any) {
    diagnostics.tests.config = 'FAIL: ' + e.message;
  }

  // Test 2: Storage Driver
  try {
    const { getStorageDriver } = await import('../apps/api/dist/services/storage/index.js');
    const storage = getStorageDriver();
    diagnostics.tests.storage = 'OK: ' + storage.constructor.name;
  } catch (e: any) {
    diagnostics.tests.storage = 'FAIL: ' + e.message;
  }

  // Test 3: Shared package
  try {
    const shared = await import('@resourcehub/shared');
    diagnostics.tests.shared = 'OK: exports=' + Object.keys(shared).length;
  } catch (e: any) {
    diagnostics.tests.shared = 'FAIL: ' + e.message;
  }

  // Test 4: Fastify App Build
  try {
    const { buildApp } = await import('../apps/api/dist/app.js');
    const app = await buildApp();
    const testRes = await app.inject({ method: 'GET', url: '/api/health' });
    diagnostics.tests.app = 'OK: status=' + testRes.statusCode + ', payload=' + testRes.body;
  } catch (e: any) {
    diagnostics.tests.app = 'FAIL: ' + e.message + ' | ' + e.stack;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(diagnostics, null, 2));
}
