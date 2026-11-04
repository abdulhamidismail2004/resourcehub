import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../../middleware/auth.js';

export const notificationsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // 1. Get user notifications
  app.get('/', { preHandler: requireAuth }, async (req, reply) => {
    const db = await getDb();

    const items = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, req.user!.id))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(30);

    const unreadCount = items.filter((n: any) => !n.isRead).length;

    return reply.send({
      success: true,
      data: {
        items,
        unreadCount,
      },
    });
  });

  // 2. Mark notification as read
  app.patch('/:id/read', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, id));

    return reply.send({ success: true });
  });

  // 3. Mark all as read
  app.post('/read-all', { preHandler: requireAuth }, async (req, reply) => {
    const db = await getDb();

    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, req.user!.id));

    return reply.send({ success: true, message: 'All notifications marked as read.' });
  });
};
