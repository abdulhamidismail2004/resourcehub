import { describe, it, expect } from 'vitest';
import handler from '../../../../api/index.js';
import { EventEmitter } from 'events';

describe('Vercel Serverless Function Adapter Integration', () => {
  it('handles incoming HTTP request via Serverless handler', async () => {
    const req: any = new EventEmitter();
    req.method = 'GET';
    req.url = '/api/health';
    req.headers = { host: 'localhost' };

    let statusCode = 0;
    const headers: Record<string, string> = {};
    let responseData = '';

    const res: any = new EventEmitter();
    res.writeHead = (status: number, hdrs: any) => {
      statusCode = status;
      if (hdrs) Object.assign(headers, hdrs);
      return res;
    };
    res.setHeader = (key: string, val: string) => {
      headers[key.toLowerCase()] = val;
      return res;
    };
    res.getHeader = (key: string) => headers[key.toLowerCase()];
    res.end = (chunk: any) => {
      if (chunk) responseData += chunk.toString();
      res.emit('finish');
    };

    await handler(req, res);

    expect(statusCode || 200).toBe(200);
    const body = JSON.parse(responseData);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('ResourceHub API');
  });
});
