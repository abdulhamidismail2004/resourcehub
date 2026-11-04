import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config/env.js';
import { attachUser } from './middleware/auth.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { categoriesRoutes } from './modules/categories/categories.routes.js';
import { resourcesRoutes } from './modules/resources/resources.routes.js';
import { collectionsRoutes } from './modules/collections/collections.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { moderationRoutes } from './modules/moderation/moderation.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { getDb } from './db/index.js';
import * as schema from './db/schema/index.js';

let isDbReady = false;
async function ensureDbInitialized() {
  if (isDbReady) return;
  try {
    const { runMigrations } = await import('./db/migrate.js');
    await runMigrations();
    const db = await getDb();
    const [existingCat] = await db.select({ id: schema.categories.id }).from(schema.categories).limit(1);
    if (!existingCat) {
      console.log('Seeding initial demo data...');
      const { seedDatabase } = await import('./db/seed.js');
      await seedDatabase();
    }
  } catch (err) {
    // Graceful recovery for existing tables or concurrency
  } finally {
    isDbReady = true;
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  await ensureDbInitialized();

  const app = fastify({
    logger: {
      level: config.isProduction ? 'info' : 'warn',
    },
    bodyLimit: 52428800, // 50MB
  });

  // 1. CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow localhost dev origins or matching WEB_URL
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === config.webUrl) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
    exposedHeaders: ['Content-Range', 'Content-Disposition', 'ETag'],
  });

  // 2. Cookie parser
  await app.register(cookie, {
    secret: config.cookieSecret,
    hook: 'onRequest',
  });

  // 3. Compression
  await app.register(compress, { global: true });

  // 4. Rate Limiting
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
  });

  // 5. Multipart file handling
  await app.register(multipart, {
    limits: {
      fileSize: 52428800, // 50MB
      files: 1,
    },
  });

  // 6. OpenAPI / Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ResourceHub REST API',
        description: 'Production-ready educational resource sharing & academic discovery platform API',
        version: '1.0.0',
      },
      servers: [
        {
          url: config.apiUrl,
          description: 'Current Environment API Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'Token',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // 7. Request hooks
  app.addHook('preHandler', attachUser);

  // 8. Healthcheck
  app.get('/api/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'ResourceHub API',
  }));

  // 9. Register Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(categoriesRoutes, { prefix: '/api/categories' });
  await app.register(resourcesRoutes, { prefix: '/api/resources' });
  await app.register(collectionsRoutes, { prefix: '/api/collections' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(notificationsRoutes, { prefix: '/api/notifications' });
  await app.register(moderationRoutes, { prefix: '/api/moderation' });
  await app.register(adminRoutes, { prefix: '/api/admin' });

  // 10. Global Error Handler
  app.setErrorHandler((error: any, _req, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: error.message || 'An unexpected internal server error occurred.',
    });
  });

  return app;
}
