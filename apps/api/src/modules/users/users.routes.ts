import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { requireAuth } from '../../middleware/auth.js';

export const usersRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // 1. Personalized User Dashboard
  app.get('/dashboard', { preHandler: requireAuth }, async (req, reply) => {
    const db = await getDb();
    const userId = req.user!.id;

    // My uploaded resources
    const myResources = await db
      .select({
        id: schema.resources.id,
        title: schema.resources.title,
        status: schema.resources.status,
        visibility: schema.resources.visibility,
        downloadCount: schema.resources.downloadCount,
        viewCount: schema.resources.viewCount,
        createdAt: schema.resources.createdAt,
        categoryName: schema.categories.name,
        fileExtension: schema.resourceFiles.fileExtension,
      })
      .from(schema.resources)
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.resources.userId, userId))
      .orderBy(desc(schema.resources.createdAt))
      .limit(6);

    // My saved bookmarks
    const savedResources = await db
      .select({
        id: schema.resources.id,
        title: schema.resources.title,
        subject: schema.resources.subject,
        downloadCount: schema.resources.downloadCount,
        thumbnailUrl: schema.resources.thumbnailUrl,
        fileExtension: schema.resourceFiles.fileExtension,
        categoryName: schema.categories.name,
      })
      .from(schema.bookmarks)
      .innerJoin(schema.resources, eq(schema.bookmarks.resourceId, schema.resources.id))
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.bookmarks.userId, userId))
      .orderBy(desc(schema.bookmarks.createdAt))
      .limit(6);

    // Recommended / Popular resources
    const popularResources = await db
      .select({
        id: schema.resources.id,
        title: schema.resources.title,
        subject: schema.resources.subject,
        downloadCount: schema.resources.downloadCount,
        bookmarkCount: schema.resources.bookmarkCount,
        thumbnailUrl: schema.resources.thumbnailUrl,
        categoryName: schema.categories.name,
        authorName: schema.users.displayName,
      })
      .from(schema.resources)
      .innerJoin(schema.users, eq(schema.resources.userId, schema.users.id))
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .where(and(eq(schema.resources.status, 'approved'), eq(schema.resources.visibility, 'public')))
      .orderBy(desc(schema.resources.downloadCount))
      .limit(6);

    // Quick Stats
    const [counts] = await db
      .select({
        uploadedCount: sql<number>`(select count(*) from ${schema.resources} where user_id = ${userId})`,
        bookmarksCount: sql<number>`(select count(*) from ${schema.bookmarks} where user_id = ${userId})`,
        collectionsCount: sql<number>`(select count(*) from ${schema.collections} where user_id = ${userId})`,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    return reply.send({
      success: true,
      data: {
        stats: {
          uploaded: Number(counts?.uploadedCount || 0),
          bookmarks: Number(counts?.bookmarksCount || 0),
          collections: Number(counts?.collectionsCount || 0),
        },
        myResources,
        savedResources,
        popularResources,
      },
    });
  });

  // 2. Public User Profile
  app.get('/:id/profile', async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    const [user] = await db
      .select({
        id: schema.users.id,
        displayName: schema.users.displayName,
        avatarUrl: schema.users.avatarUrl,
        bio: schema.users.bio,
        institution: schema.users.institution,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found.' });
    }

    // Public contributions
    const resources = await db
      .select({
        id: schema.resources.id,
        title: schema.resources.title,
        description: schema.resources.description,
        subject: schema.resources.subject,
        academicLevel: schema.resources.academicLevel,
        downloadCount: schema.resources.downloadCount,
        bookmarkCount: schema.resources.bookmarkCount,
        thumbnailUrl: schema.resources.thumbnailUrl,
        createdAt: schema.resources.createdAt,
        categoryName: schema.categories.name,
        fileExtension: schema.resourceFiles.fileExtension,
      })
      .from(schema.resources)
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(
        and(
          eq(schema.resources.userId, id),
          eq(schema.resources.status, 'approved'),
          eq(schema.resources.visibility, 'public')
        )
      )
      .orderBy(desc(schema.resources.createdAt));

    // Public collections
    const collections = await db
      .select({
        id: schema.collections.id,
        name: schema.collections.name,
        description: schema.collections.description,
        createdAt: schema.collections.createdAt,
        itemCount: sql<number>`cast(count(${schema.collectionItems.id}) as int)`,
      })
      .from(schema.collections)
      .leftJoin(schema.collectionItems, eq(schema.collections.id, schema.collectionItems.collectionId))
      .where(and(eq(schema.collections.userId, id), eq(schema.collections.isPublic, true)))
      .groupBy(schema.collections.id)
      .orderBy(desc(schema.collections.createdAt));

    const totalDownloads = resources.reduce((acc: number, curr: any) => acc + curr.downloadCount, 0);

    return reply.send({
      success: true,
      data: {
        user,
        stats: {
          resourcesCount: resources.length,
          downloadsCount: totalDownloads,
          collectionsCount: collections.length,
        },
        resources,
        collections,
      },
    });
  });
};
