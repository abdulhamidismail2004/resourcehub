import { buildApp } from '../apps/api/src/app.js';
import type { FastifyInstance } from 'fastify';

let appInstance: FastifyInstance | null = null;

export default async function handler(req: any, res: any) {
  try {
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

    const response = await appInstance.inject({
      method: req.method,
      url: req.url,
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
    res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
  }
}
