import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import { requireRole } from '../../middleware/auth.js';
import { z } from 'zod';

export const categoriesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // List all categories with count of approved resources
  app.get('/', async (_req, reply) => {
    const db = await getDb();

    const result = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
        description: schema.categories.description,
        icon: schema.categories.icon,
        resourceCount: sql<number>`cast(count(${schema.resources.id}) as int)`,
      })
      .from(schema.categories)
      .leftJoin(
        schema.resources,
        sql`${schema.categories.id} = ${schema.resources.categoryId} AND ${schema.resources.status} = 'approved' AND ${schema.resources.visibility} = 'public'`
      )
      .groupBy(schema.categories.id)
      .orderBy(schema.categories.name);

    return reply.send({ success: true, data: result });
  });

  // List tags with resource counts
  app.get('/tags', async (_req, reply) => {
    const db = await getDb();

    const result = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
        resourceCount: sql<number>`cast(count(${schema.resourceTags.resourceId}) as int)`,
      })
      .from(schema.tags)
      .leftJoin(schema.resourceTags, eq(schema.tags.id, schema.resourceTags.tagId))
      .groupBy(schema.tags.id)
      .orderBy(sql`count(${schema.resourceTags.resourceId}) DESC`)
      .limit(50);

    return reply.send({ success: true, data: result });
  });

  // Create Category (Admin only)
  app.post(
    '/',
    { preHandler: requireRole(['admin']) },
    async (req, reply) => {
      const categorySchema = z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
        icon: z.string().optional(),
      });

      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: parsed.error.issues[0]?.message });
      }

      const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const db = await getDb();

      const [newCat] = await db
        .insert(schema.categories)
        .values({
          name: parsed.data.name,
          slug,
          description: parsed.data.description || null,
          icon: parsed.data.icon || 'Folder',
        })
        .returning();

      return reply.status(201).send({ success: true, data: newCat });
    }
  );
};
