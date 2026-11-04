import { buildApp } from '../apps/api/src/app.js';
import { seedDatabase } from '../apps/api/src/db/seed.js';
import type { FastifyInstance } from 'fastify';

let appInstance: FastifyInstance | null = null;
let initPromise: Promise<void> | null = null;

async function initialize() {
  try {
    await seedDatabase();
  } catch (err: any) {
    console.warn('Database initialization note:', err.message);
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (!initPromise) {
      initPromise = initialize();
    }
    await initPromise;

    if (!appInstance) {
      appInstance = await buildApp();
      await appInstance.ready();
    }

    // Read payload if present
    let payload: any = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        payload = typeof req.body === 'string' || Buffer.isBuffer(req.body)
          ? req.body
          : JSON.stringify(req.body);
      } else if (typeof req[Symbol.asyncIterator] === 'function') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.from(chunk));
        }
        if (chunks.length > 0) {
          payload = Buffer.concat(chunks);
        }
      }
    }

    // Resolve target URL (recover original path if rewritten to /api/index)
    let targetUrl = req.url || '/api/health';
    if (targetUrl.startsWith('/api/index')) {
      const matched = req.headers['x-matched-path'];
      if (matched && typeof matched === 'string') {
        const queryIndex = targetUrl.indexOf('?');
        targetUrl = matched + (queryIndex !== -1 ? targetUrl.slice(queryIndex) : '');
      }
    }

    const response = await appInstance.inject({
      method: req.method,
      url: targetUrl,
      headers: req.headers,
      query: req.query,
      payload,
    });

    res.statusCode = response.statusCode;
    for (const [header, value] of Object.entries(response.headers)) {
      if (value !== undefined) {
        res.setHeader(header, value);
      }
    }
    res.end(response.rawPayload);
  } catch (err: any) {
    console.error('Serverless function error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      success: false, 
      error: err.message || 'Internal Server Error',
      name: err.name,
      stack: process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true' ? err.stack : undefined
    }));
  }
}
