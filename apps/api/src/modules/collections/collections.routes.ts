import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { createCollectionSchema, updateCollectionSchema, addCollectionItemSchema } from '@resourcehub/shared';
import { requireAuth } from '../../middleware/auth.js';

export const collectionsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // 1. List user's collections
  app.get('/', { preHandler: requireAuth }, async (req, reply) => {
    const db = await getDb();

    const rows = await db
      .select({
        id: schema.collections.id,
        userId: schema.collections.userId,
        name: schema.collections.name,
        description: schema.collections.description,
        isPublic: schema.collections.isPublic,
        createdAt: schema.collections.createdAt,
        updatedAt: schema.collections.updatedAt,
        itemCount: sql<number>`cast(count(${schema.collectionItems.id}) as int)`,
      })
      .from(schema.collections)
      .leftJoin(schema.collectionItems, eq(schema.collections.id, schema.collectionItems.collectionId))
      .where(eq(schema.collections.userId, req.user!.id))
      .groupBy(schema.collections.id)
      .orderBy(desc(schema.collections.updatedAt));

    return reply.send({ success: true, data: rows });
  });

  // 2. Get Collection Details with Items
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    const [collection] = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    if (!collection) {
      return reply.status(404).send({ success: false, error: 'Collection not found.' });
    }

    if (!collection.isPublic && req.user?.id !== collection.userId) {
      return reply.status(403).send({ success: false, error: 'This collection is private.' });
    }

    const items = await db
      .select({
        id: schema.collectionItems.id,
        resourceId: schema.collectionItems.resourceId,
        addedAt: schema.collectionItems.addedAt,
        title: schema.resources.title,
        description: schema.resources.description,
        subject: schema.resources.subject,
        academicLevel: schema.resources.academicLevel,
        downloadCount: schema.resources.downloadCount,
        thumbnailUrl: schema.resources.thumbnailUrl,
        fileExtension: schema.resourceFiles.fileExtension,
        fileSize: schema.resourceFiles.fileSize,
        categoryName: schema.categories.name,
        authorName: schema.users.displayName,
      })
      .from(schema.collectionItems)
      .innerJoin(schema.resources, eq(schema.collectionItems.resourceId, schema.resources.id))
      .innerJoin(schema.users, eq(schema.resources.userId, schema.users.id))
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.collectionItems.collectionId, id))
      .orderBy(desc(schema.collectionItems.addedAt));

    return reply.send({
      success: true,
      data: {
        ...collection,
        items,
      },
    });
  });

  // 3. Create Collection
  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createCollectionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.issues[0]?.message });
    }

    const db = await getDb();
    const [newCollection] = await db
      .insert(schema.collections)
      .values({
        userId: req.user!.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        isPublic: parsed.data.isPublic ?? false,
      })
      .returning();

    return reply.status(201).send({ success: true, data: newCollection });
  });

  // 4. Update Collection
  app.patch('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateCollectionSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.issues[0]?.message });
    }

    const db = await getDb();
    const [existing] = await db
      .select({ userId: schema.collections.userId })
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    if (!existing) {
      return reply.status(404).send({ success: false, error: 'Collection not found.' });
    }

    if (existing.userId !== req.user!.id) {
      return reply.status(403).send({ success: false, error: 'Unauthorized to edit this collection.' });
    }

    const [updated] = await db
      .update(schema.collections)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(schema.collections.id, id))
      .returning();

    return reply.send({ success: true, data: updated });
  });

  // 5. Delete Collection
  app.delete('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    const [existing] = await db
      .select({ userId: schema.collections.userId })
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    if (!existing) {
      return reply.status(404).send({ success: false, error: 'Collection not found.' });
    }

    if (existing.userId !== req.user!.id) {
      return reply.status(403).send({ success: false, error: 'Unauthorized to delete this collection.' });
    }

    await db.delete(schema.collections).where(eq(schema.collections.id, id));
    return reply.send({ success: true, message: 'Collection deleted successfully.' });
  });

  // 6. Add Resource to Collection
  app.post('/:id/items', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = addCollectionItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.issues[0]?.message });
    }

    const db = await getDb();
    const [collection] = await db
      .select({ userId: schema.collections.userId })
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    if (!collection) {
      return reply.status(404).send({ success: false, error: 'Collection not found.' });
    }

    if (collection.userId !== req.user!.id) {
      return reply.status(403).send({ success: false, error: 'Unauthorized.' });
    }

    await db
      .insert(schema.collectionItems)
      .values({
        collectionId: id,
        resourceId: parsed.data.resourceId,
      })
      .onConflictDoNothing();

    return reply.status(201).send({ success: true, message: 'Resource added to collection.' });
  });

  // 7. Remove Resource from Collection
  app.delete('/:id/items/:resourceId', { preHandler: requireAuth }, async (req, reply) => {
    const { id, resourceId } = req.params as { id: string; resourceId: string };
    const db = await getDb();

    const [collection] = await db
      .select({ userId: schema.collections.userId })
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    if (!collection || collection.userId !== req.user!.id) {
      return reply.status(403).send({ success: false, error: 'Unauthorized.' });
    }

    await db
      .delete(schema.collectionItems)
      .where(
        and(
          eq(schema.collectionItems.collectionId, id),
          eq(schema.collectionItems.resourceId, resourceId)
        )
      );

    return reply.send({ success: true, message: 'Resource removed from collection.' });
  });
};
