import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq, sql, desc, or, ilike } from 'drizzle-orm';
import { updateUserRoleSchema } from '@resourcehub/shared';
import { requireRole } from '../../middleware/auth.js';
import { AuditService } from '../../services/audit.service.js';

export const adminRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Enforce Administrator role across all routes in this plugin
  app.addHook('preHandler', requireRole(['admin']));

  // 1. Platform Metrics
  app.get('/metrics', async (_req, reply) => {
    const db = await getDb();

    const [userCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.users);
    const [resCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.resources);
    const [downloadCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.downloadEvents);
    const [bookmarkCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.bookmarks);
    const [pendingCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.resources)
      .where(eq(schema.resources.status, 'pending'));
    const [reportCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.reports)
      .where(eq(schema.reports.status, 'pending'));
    const [storageSum] = await db
      .select({ totalBytes: sql<number>`cast(coalesce(sum(${schema.resourceFiles.fileSize}), 0) as bigint)` })
      .from(schema.resourceFiles);

    return reply.send({
      success: true,
      data: {
        totalUsers: userCount?.count || 0,
        totalResources: resCount?.count || 0,
        totalDownloads: downloadCount?.count || 0,
        totalBookmarks: bookmarkCount?.count || 0,
        pendingApprovals: pendingCount?.count || 0,
        openReports: reportCount?.count || 0,
        totalStorageBytes: Number(storageSum?.totalBytes || 0),
      },
    });
  });

  // 2. Users Management
  app.get('/users', async (req, reply) => {
    const { q, role, page = 1, pageSize = 20 } = req.query as any;
    const db = await getDb();
    const offset = (Number(page) - 1) * Number(pageSize);

    let query = db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
        role: schema.users.role,
        institution: schema.users.institution,
        isVerified: schema.users.isVerified,
        isSuspended: schema.users.isSuspended,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(Number(pageSize))
      .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(schema.users);
    const users = await query;

    return reply.send({
      success: true,
      data: {
        items: users,
        total: countResult?.count || 0,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  });

  // 3. Update User Role
  app.patch('/users/:id/role', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.issues[0]?.message });
    }

    if (id === req.user!.id) {
      return reply.status(400).send({ success: false, error: 'Cannot modify your own administrator role.' });
    }

    const db = await getDb();
    const [updated] = await db
      .update(schema.users)
      .set({ role: parsed.data.role, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();

    await AuditService.log({
      userId: req.user!.id,
      action: 'USER_ROLE_CHANGED',
      targetType: 'user',
      targetId: id,
      metadata: { newRole: parsed.data.role },
      ipAddress: req.ip,
    });

    return reply.send({ success: true, data: updated });
  });

  // 4. Suspend / Unsuspend User
  app.post('/users/:id/suspend', async (req, reply) => {
    const { id } = req.params as { id: string };

    if (id === req.user!.id) {
      return reply.status(400).send({ success: false, error: 'Cannot suspend your own account.' });
    }

    const db = await getDb();
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found.' });
    }

    const newSuspended = !user.isSuspended;
    await db
      .update(schema.users)
      .set({ isSuspended: newSuspended, updatedAt: new Date() })
      .where(eq(schema.users.id, id));

    // If suspended, invalidate all active sessions immediately
    if (newSuspended) {
      await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
    }

    await AuditService.log({
      userId: req.user!.id,
      action: newSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
    });

    return reply.send({
      success: true,
      isSuspended: newSuspended,
      message: newSuspended ? 'User suspended and sessions revoked.' : 'User unsuspended.',
    });
  });

  // 5. Audit Logs
  app.get('/audit-logs', async (req, reply) => {
    const { page = 1, pageSize = 50 } = req.query as any;
    const db = await getDb();
    const offset = (Number(page) - 1) * Number(pageSize);

    const logs = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        targetType: schema.auditLogs.targetType,
        targetId: schema.auditLogs.targetId,
        metadata: schema.auditLogs.metadata,
        ipAddress: schema.auditLogs.ipAddress,
        createdAt: schema.auditLogs.createdAt,
        userDisplayName: schema.users.displayName,
        userEmail: schema.users.email,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(Number(pageSize))
      .offset(offset);

    return reply.send({ success: true, data: logs });
  });
};
