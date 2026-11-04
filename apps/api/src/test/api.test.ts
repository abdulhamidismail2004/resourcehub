import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import { seedDatabase } from '../db/seed.js';
import { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let adminToken = '';
let studentToken = '';
let sampleResourceId = '';

beforeAll(async () => {
  await seedDatabase();
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('ResourceHub API Integration Tests', () => {
  it('1. Healthcheck returns status ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('ResourceHub API');
  });

  it('2. Categories endpoint returns seeded categories', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/categories',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((c: any) => c.slug === 'computer-science')).toBe(true);
  });

  it('3. Auth: Login with Admin credentials succeeds', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@resourcehub.edu',
        password: 'AdminPassword123!',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe('admin');
    expect(body.data.token).toBeDefined();
    adminToken = body.data.token;
  });

  it('4. Auth: Login with Student credentials succeeds', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'student@resourcehub.edu',
        password: 'Password123!',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe('user');
    studentToken = body.data.token;
  });

  it('5. Auth: Login with wrong password returns 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'student@resourcehub.edu',
        password: 'WrongPassword!',
      },
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(false);
  });

  it('6. Auth: GET /api/auth/me returns authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('student@resourcehub.edu');
  });

  it('7. Resources: GET /api/resources returns search and pagination', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/resources',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);
    expect(body.data.total).toBeGreaterThan(0);
    sampleResourceId = body.data.items[0].id;
  });

  it('8. Resources: Full-text search by title/keyword works', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/resources?q=Algorithms',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.items.some((item: any) => item.title.includes('Algorithms'))).toBe(true);
  });

  it('9. Resource Details: GET /api/resources/:id returns metadata and related resources', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/resources/${sampleResourceId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(sampleResourceId);
    expect(body.data.author).toBeDefined();
    expect(body.data.category).toBeDefined();
  });

  it('10. Downloads: GET /api/resources/:id/download streams real file content', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/resources/${sampleResourceId}/download`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.body.startsWith('%PDF-1.4')).toBe(true);
  });

  it('11. Bookmarks: Toggle bookmark adds and removes bookmark', async () => {
    // Toggle on
    const res1 = await app.inject({
      method: 'POST',
      url: `/api/resources/${sampleResourceId}/bookmark`,
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    expect(res1.statusCode).toBe(200);
    const body1 = JSON.parse(res1.payload);
    expect(body1.success).toBe(true);

    // Toggle off
    const res2 = await app.inject({
      method: 'POST',
      url: `/api/resources/${sampleResourceId}/bookmark`,
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse(res2.payload);
    expect(body2.success).toBe(true);
  });

  it('12. Admin: GET /api/admin/metrics returns system counts for admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/metrics',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.totalUsers).toBeGreaterThan(0);
    expect(body.data.totalResources).toBeGreaterThan(0);
  });

  it('13. Admin: Non-admin user cannot access admin metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/metrics',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    expect(res.statusCode).toBe(403);
  });
});
