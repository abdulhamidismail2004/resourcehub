import { buildApp } from './app.js';
import { config } from './config/env.js';
import { runMigrations } from './db/migrate.js';

async function start() {
  try {
    // Ensure migrations are run on startup
    await runMigrations();

    const app = await buildApp();
    await app.listen({ port: config.port, host: config.host });
    console.log(`ResourceHub API server running at http://${config.host}:${config.port}`);
    console.log(`API Documentation available at http://${config.host}:${config.port}/api/docs`);
  } catch (err) {
    console.error('Failed to start ResourceHub API:', err);
    process.exit(1);
  }
}

start();
