import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { createReportSchema, moderationActionSchema } from '@resourcehub/shared';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { AuditService } from '../../services/audit.service.js';

export const moderationRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // 1. Submit Content Report (Any authenticated user)
  app.post('/reports', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.issues[0]?.message });
    }

    const db = await getDb();
    const [report] = await db
      .insert(schema.reports)
      .values({
        reporterId: req.user!.id,
        resourceId: parsed.data.resourceId,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
      })
      .returning();

    return reply.status(201).send({
      success: true,
      data: report,
      message: 'Report submitted. Our academic moderation team will review this resource.',
    });
  });

  // 2. List Reports (Moderators & Admins)
  app.get('/reports', { preHandler: requireRole(['moderator', 'admin']) }, async (_req, reply) => {
    const db = await getDb();

    const reports = await db
      .select({
        id: schema.reports.id,
        reason: schema.reports.reason,
        details: schema.reports.details,
        status: schema.reports.status,
        createdAt: schema.reports.createdAt,
        updatedAt: schema.reports.updatedAt,
        reporterName: schema.users.displayName,
        reporterEmail: schema.users.email,
        resourceId: schema.resources.id,
        resourceTitle: schema.resources.title,
        resourceStatus: schema.resources.status,
      })
      .from(schema.reports)
      .innerJoin(schema.users, eq(schema.reports.reporterId, schema.users.id))
      .innerJoin(schema.resources, eq(schema.reports.resourceId, schema.resources.id))
      .orderBy(desc(schema.reports.createdAt));

    return reply.send({ success: true, data: reports });
  });

  // 3. Resolve / Dismiss Report
  app.patch('/reports/:id', { preHandler: requireRole(['moderator', 'admin']) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status, note } = req.body as { status: 'resolved' | 'dismissed'; note?: string };

    if (!['resolved', 'dismissed'].includes(status)) {
      return reply.status(400).send({ success: false, error: 'Invalid report status' });
    }

    const db = await getDb();
    const [updated] = await db
      .update(schema.reports)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.reports.id, id))
      .returning();

    await db.insert(schema.moderationActions).values({
      moderatorId: req.user!.id,
      targetType: 'report',
      targetId: id,
      action: status === 'resolved' ? 'resolve_report' : 'dismiss_report',
      note: note || null,
    });

    await AuditService.log({
      userId: req.user!.id,
      action: `REPORT_${status.toUpperCase()}`,
      targetType: 'report',
      targetId: id,
      metadata: { status, note },
      ipAddress: req.ip,
    });

    return reply.send({ success: true, data: updated });
  });

  // 4. List Pending Resources
  app.get('/pending', { preHandler: requireRole(['moderator', 'admin']) }, async (_req, reply) => {
    const db = await getDb();

    const pending = await db
      .select({
        id: schema.resources.id,
        title: schema.resources.title,
        description: schema.resources.description,
        subject: schema.resources.subject,
        academicLevel: schema.resources.academicLevel,
        status: schema.resources.status,
        createdAt: schema.resources.createdAt,
        authorName: schema.users.displayName,
        authorEmail: schema.users.email,
        categoryName: schema.categories.name,
        fileExtension: schema.resourceFiles.fileExtension,
        fileSize: schema.resourceFiles.fileSize,
      })
      .from(schema.resources)
      .innerJoin(schema.users, eq(schema.resources.userId, schema.users.id))
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.resources.status, 'pending'))
      .orderBy(desc(schema.resources.createdAt));

    return reply.send({ success: true, data: pending });
  });

  // 5. Moderate Resource (Approve / Reject)
  app.post('/resources/:id/action', { preHandler: requireRole(['moderator', 'admin']) }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { action, note } = req.body as { action: 'approve' | 'reject'; note?: string };

    if (!['approve', 'reject'].includes(action)) {
      return reply.status(400).send({ success: false, error: 'Invalid moderation action.' });
    }

    const db = await getDb();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const [updatedResource] = await db
      .update(schema.resources)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(schema.resources.id, id))
      .returning();

    if (!updatedResource) {
      return reply.status(404).send({ success: false, error: 'Resource not found.' });
    }

    // Record action
    await db.insert(schema.moderationActions).values({
      moderatorId: req.user!.id,
      targetType: 'resource',
      targetId: id,
      action: action,
      note: note || null,
    });

    // Notify author
    await db.insert(schema.notifications).values({
      userId: updatedResource.userId,
      type: action === 'approve' ? 'upload_approved' : 'upload_rejected',
      title: action === 'approve' ? 'Resource Approved!' : 'Resource Needs Revision',
      message:
        action === 'approve'
          ? `Your resource "${updatedResource.title}" has been approved and is now public.`
          : `Your resource "${updatedResource.title}" was not approved: ${note || 'Violates guidelines.'}`,
      linkUrl: `/resources/${updatedResource.id}`,
    });

    await AuditService.log({
      userId: req.user!.id,
      action: `RESOURCE_${action.toUpperCase()}D`,
      targetType: 'resource',
      targetId: id,
      metadata: { action, note },
      ipAddress: req.ip,
    });

    return reply.send({ success: true, data: updatedResource });
  });
};
