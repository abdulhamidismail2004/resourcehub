import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { searchResourceSchema, createResourceSchema, updateResourceSchema } from '@resourcehub/shared';
import { requireAuth } from '../../middleware/auth.js';
import { getStorageDriver } from '../../services/storage/index.js';
import { FileValidatorService } from '../../services/file-validator.service.js';
import { ThumbnailService } from '../../services/thumbnail.service.js';
import { AuditService } from '../../services/audit.service.js';
import crypto from 'crypto';

export const resourcesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // 1. List / Search Resources
  app.get('/', async (req, reply) => {
    const parsed = searchResourceSchema.safeParse(req.query);
    const {
      q,
      categoryId,
      tag,
      academicLevel,
      subject,
      fileExtension,
      sortBy = 'recent',
      sortOrder = 'desc',
      page = 1,
      pageSize = 12,
    } = parsed.success ? parsed.data : (req.query as any);

    const db = await getDb();
    const offset = (Number(page) - 1) * Number(pageSize);

    // Build conditions
    const conditions = [
      eq(schema.resources.status, 'approved'),
      eq(schema.resources.visibility, 'public'),
    ];

    if (categoryId) {
      conditions.push(eq(schema.resources.categoryId, categoryId));
    }

    if (academicLevel && academicLevel !== 'all') {
      conditions.push(eq(schema.resources.academicLevel, academicLevel));
    }

    if (subject) {
      conditions.push(sql`LOWER(${schema.resources.subject}) = LOWER(${subject})`);
    }

    if (q && q.trim()) {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      conditions.push(
        sql`(LOWER(${schema.resources.title}) LIKE ${searchTerm} OR LOWER(${schema.resources.description}) LIKE ${searchTerm} OR LOWER(${schema.resources.subject}) LIKE ${searchTerm})`
      );
    }

    // Build sort
    let orderClause = desc(schema.resources.createdAt);
    if (sortBy === 'downloads') {
      orderClause = sortOrder === 'asc' ? asc(schema.resources.downloadCount) : desc(schema.resources.downloadCount);
    } else if (sortBy === 'bookmarks') {
      orderClause = sortOrder === 'asc' ? asc(schema.resources.bookmarkCount) : desc(schema.resources.bookmarkCount);
    } else if (sortBy === 'views') {
      orderClause = sortOrder === 'asc' ? asc(schema.resources.viewCount) : desc(schema.resources.viewCount);
    } else if (sortBy === 'title') {
      orderClause = sortOrder === 'asc' ? asc(schema.resources.title) : desc(schema.resources.title);
    } else if (sortBy === 'recent') {
      orderClause = sortOrder === 'asc' ? asc(schema.resources.createdAt) : desc(schema.resources.createdAt);
    }

    const whereClause = and(...conditions);

    // Count total matching
    const [countResult] = await db
      .select({ count: sql<number>`cast(count(DISTINCT ${schema.resources.id}) as int)` })
      .from(schema.resources)
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .leftJoin(schema.resourceTags, eq(schema.resources.id, schema.resourceTags.resourceId))
      .leftJoin(schema.tags, eq(schema.resourceTags.tagId, schema.tags.id))
      .where(
        tag
          ? and(whereClause, eq(schema.tags.slug, tag))
          : fileExtension
          ? and(whereClause, eq(schema.resourceFiles.fileExtension, fileExtension))
          : whereClause
      );

    const total = countResult?.count || 0;

    // Query items
    const rows = await db
      .select({
        id: schema.resources.id,
        userId: schema.resources.userId,
        categoryId: schema.resources.categoryId,
        title: schema.resources.title,
        description: schema.resources.description,
        subject: schema.resources.subject,
        academicLevel: schema.resources.academicLevel,
        institution: schema.resources.institution,
        visibility: schema.resources.visibility,
        status: schema.resources.status,
        downloadCount: schema.resources.downloadCount,
        bookmarkCount: schema.resources.bookmarkCount,
        viewCount: schema.resources.viewCount,
        thumbnailUrl: schema.resources.thumbnailUrl,
        createdAt: schema.resources.createdAt,
        updatedAt: schema.resources.updatedAt,
        authorName: schema.users.displayName,
        authorAvatar: schema.users.avatarUrl,
        authorInstitution: schema.users.institution,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
        fileExtension: schema.resourceFiles.fileExtension,
        fileSize: schema.resourceFiles.fileSize,
        mimeType: schema.resourceFiles.mimeType,
      })
      .from(schema.resources)
      .innerJoin(schema.users, eq(schema.resources.userId, schema.users.id))
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .leftJoin(schema.resourceTags, eq(schema.resources.id, schema.resourceTags.resourceId))
      .leftJoin(schema.tags, eq(schema.resourceTags.tagId, schema.tags.id))
      .where(
        tag
          ? and(whereClause, eq(schema.tags.slug, tag))
          : fileExtension
          ? and(whereClause, eq(schema.resourceFiles.fileExtension, fileExtension))
          : whereClause
      )
      .groupBy(
        schema.resources.id,
        schema.users.id,
        schema.categories.id,
        schema.resourceFiles.fileExtension,
        schema.resourceFiles.fileSize,
        schema.resourceFiles.mimeType
      )
      .orderBy(orderClause)
      .limit(Number(pageSize))
      .offset(offset);

    // Format output
    const items = rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      categoryId: r.categoryId,
      title: r.title,
      description: r.description,
      subject: r.subject,
      academicLevel: r.academicLevel,
      institution: r.institution,
      visibility: r.visibility,
      status: r.status,
      downloadCount: r.downloadCount,
      bookmarkCount: r.bookmarkCount,
      viewCount: r.viewCount,
      thumbnailUrl: r.thumbnailUrl,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      author: {
        id: r.userId,
        displayName: r.authorName,
        avatarUrl: r.authorAvatar,
        institution: r.authorInstitution,
      },
      category: {
        id: r.categoryId,
        name: r.categoryName,
        slug: r.categorySlug,
      },
      file: {
        fileExtension: r.fileExtension,
        fileSize: Number(r.fileSize),
        mimeType: r.mimeType,
      },
    }));

    return reply.send({
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
        hasMore: offset + items.length < total,
      },
    });
  });

  // 2. Get User's Bookmarked Resources
  app.get('/user/saved', { preHandler: requireAuth }, async (req, reply) => {
    const db = await getDb();

    const rows = await db
      .select({
        id: schema.resources.id,
        userId: schema.resources.userId,
        categoryId: schema.resources.categoryId,
        title: schema.resources.title,
        description: schema.resources.description,
        subject: schema.resources.subject,
        academicLevel: schema.resources.academicLevel,
        institution: schema.resources.institution,
        downloadCount: schema.resources.downloadCount,
        bookmarkCount: schema.resources.bookmarkCount,
        viewCount: schema.resources.viewCount,
        thumbnailUrl: schema.resources.thumbnailUrl,
        createdAt: schema.resources.createdAt,
        updatedAt: schema.resources.updatedAt,
        authorName: schema.users.displayName,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
        fileExtension: schema.resourceFiles.fileExtension,
        fileSize: schema.resourceFiles.fileSize,
        bookmarkedAt: schema.bookmarks.createdAt,
      })
      .from(schema.bookmarks)
      .innerJoin(schema.resources, eq(schema.bookmarks.resourceId, schema.resources.id))
      .innerJoin(schema.users, eq(schema.resources.userId, schema.users.id))
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.bookmarks.userId, req.user!.id))
      .orderBy(desc(schema.bookmarks.createdAt));

    return reply.send({ success: true, data: rows });
  });

  // 3. Get Resource Details
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    const [resource] = await db
      .select({
        id: schema.resources.id,
        userId: schema.resources.userId,
        categoryId: schema.resources.categoryId,
        title: schema.resources.title,
        description: schema.resources.description,
        subject: schema.resources.subject,
        academicLevel: schema.resources.academicLevel,
        institution: schema.resources.institution,
        visibility: schema.resources.visibility,
        status: schema.resources.status,
        downloadCount: schema.resources.downloadCount,
        bookmarkCount: schema.resources.bookmarkCount,
        viewCount: schema.resources.viewCount,
        thumbnailUrl: schema.resources.thumbnailUrl,
        createdAt: schema.resources.createdAt,
        updatedAt: schema.resources.updatedAt,
        authorId: schema.users.id,
        authorName: schema.users.displayName,
        authorAvatar: schema.users.avatarUrl,
        authorBio: schema.users.bio,
        authorInstitution: schema.users.institution,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
        categoryDesc: schema.categories.description,
        fileId: schema.resourceFiles.id,
        originalName: schema.resourceFiles.originalName,
        mimeType: schema.resourceFiles.mimeType,
        fileSize: schema.resourceFiles.fileSize,
        fileExtension: schema.resourceFiles.fileExtension,
      })
      .from(schema.resources)
      .innerJoin(schema.users, eq(schema.resources.userId, schema.users.id))
      .innerJoin(schema.categories, eq(schema.resources.categoryId, schema.categories.id))
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.resources.id, id))
      .limit(1);

    if (!resource) {
      return reply.status(404).send({ success: false, error: 'Resource not found.' });
    }

    // Access check: If private or unapproved, only author or mod/admin can view
    if (
      resource.visibility === 'private' ||
      resource.status !== 'approved'
    ) {
      const isAuthor = req.user?.id === resource.userId;
      const isModOrAdmin = req.user && ['moderator', 'admin'].includes(req.user.role);
      if (!isAuthor && !isModOrAdmin) {
        return reply.status(403).send({ success: false, error: 'You do not have permission to view this resource.' });
      }
    }

    // Increment view count asynchronously
    await db
      .update(schema.resources)
      .set({ viewCount: sql`${schema.resources.viewCount} + 1` })
      .where(eq(schema.resources.id, id));

    // Get tags
    const tags = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.resourceTags)
      .innerJoin(schema.tags, eq(schema.resourceTags.tagId, schema.tags.id))
      .where(eq(schema.resourceTags.resourceId, id));

    // Check if bookmarked by current user
    let isBookmarked = false;
    if (req.user) {
      const [bookmark] = await db
        .select({ id: schema.bookmarks.id })
        .from(schema.bookmarks)
        .where(and(eq(schema.bookmarks.userId, req.user.id), eq(schema.bookmarks.resourceId, id)))
        .limit(1);
      isBookmarked = !!bookmark;
    }

    // Get related resources
    const related = await db
      .select({
        id: schema.resources.id,
        title: schema.resources.title,
        subject: schema.resources.subject,
        downloadCount: schema.resources.downloadCount,
        thumbnailUrl: schema.resources.thumbnailUrl,
        fileExtension: schema.resourceFiles.fileExtension,
      })
      .from(schema.resources)
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(
        and(
          eq(schema.resources.categoryId, resource.categoryId),
          eq(schema.resources.status, 'approved'),
          eq(schema.resources.visibility, 'public'),
          sql`${schema.resources.id} != ${id}`
        )
      )
      .limit(4);

    return reply.send({
      success: true,
      data: {
        id: resource.id,
        userId: resource.userId,
        categoryId: resource.categoryId,
        title: resource.title,
        description: resource.description,
        subject: resource.subject,
        academicLevel: resource.academicLevel,
        institution: resource.institution,
        visibility: resource.visibility,
        status: resource.status,
        downloadCount: resource.downloadCount,
        bookmarkCount: resource.bookmarkCount,
        viewCount: resource.viewCount + 1,
        thumbnailUrl: resource.thumbnailUrl,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
        author: {
          id: resource.authorId,
          displayName: resource.authorName,
          avatarUrl: resource.authorAvatar,
          bio: resource.authorBio,
          institution: resource.authorInstitution,
        },
        category: {
          id: resource.categoryId,
          name: resource.categoryName,
          slug: resource.categorySlug,
          description: resource.categoryDesc,
        },
        tags,
        file: resource.fileId
          ? {
              id: resource.fileId,
              originalName: resource.originalName,
              mimeType: resource.mimeType,
              fileSize: Number(resource.fileSize),
              fileExtension: resource.fileExtension,
            }
          : null,
        isBookmarked,
        relatedResources: related,
      },
    });
  });

  // 4. File Upload & Resource Creation
  app.post('/upload', { preHandler: requireAuth }, async (req, reply) => {
    // Process multipart request
    const parts = req.parts();
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let fileMime = '';
    const fields: Record<string, any> = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(Buffer.from(chunk));
        }
        fileBuffer = Buffer.concat(chunks);
        fileName = part.filename;
        fileMime = part.mimetype;
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'No file was provided in the upload request.',
      });
    }

    // Validate file
    const validation = FileValidatorService.validateFileSignature(fileBuffer, fileName, fileMime);
    if (!validation.isValid) {
      return reply.status(400).send({
        success: false,
        error: validation.error || 'Invalid file format or corrupt file signature.',
      });
    }

    // Parse and validate metadata fields
    let tagsList: string[] = [];
    if (fields.tags) {
      try {
        tagsList = typeof fields.tags === 'string' ? JSON.parse(fields.tags) : fields.tags;
      } catch {
        tagsList = fields.tags.split(',').map((t: string) => t.trim());
      }
    }

    const metadataToValidate = {
      title: fields.title,
      description: fields.description,
      categoryId: fields.categoryId,
      subject: fields.subject,
      academicLevel: fields.academicLevel,
      institution: fields.institution || req.user!.institution,
      visibility: fields.visibility || 'public',
      tags: tagsList,
    };

    const parsed = createResourceSchema.safeParse(metadataToValidate);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid resource metadata',
      });
    }

    const { title, description, categoryId, subject, academicLevel, institution, visibility, tags } = parsed.data;

    // Checksum & Unique Storage Key
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const safeBaseName = FileValidatorService.sanitizeFileName(fileName);
    const storageKey = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeBaseName}`;

    // Upload via Storage Driver
    const storage = getStorageDriver();
    await storage.upload(storageKey, fileBuffer, validation.detectedMime);

    // Initial status:
    // Teachers/moderators/admins are automatically approved; students/users in production might be pending,
    // here verified users are approved by default for instant delight, but moderation status is tracked.
    const initialStatus = 'approved';

    const db = await getDb();
    const resourceId = crypto.randomUUID();

    // Generate thumbnail if image
    let thumbnailUrl: string | null = null;
    if (['image/jpeg', 'image/png', 'image/webp'].includes(validation.detectedMime)) {
      thumbnailUrl = await ThumbnailService.generateThumbnail(fileBuffer, validation.detectedMime, resourceId);
    }

    // Insert Resource
    const [createdResource] = await db
      .insert(schema.resources)
      .values({
        id: resourceId,
        userId: req.user!.id,
        categoryId,
        title,
        description,
        subject,
        academicLevel,
        institution: institution || null,
        visibility,
        status: initialStatus,
        thumbnailUrl: thumbnailUrl || null,
      })
      .returning();

    // Insert Resource File
    await db.insert(schema.resourceFiles).values({
      resourceId,
      originalName: fileName,
      storageKey,
      mimeType: validation.detectedMime,
      fileSize: fileBuffer.length,
      fileExtension: validation.extension,
      checksumSha256: checksum,
    });

    // Handle Tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!slug) continue;

        let [existingTag] = await db
          .select({ id: schema.tags.id })
          .from(schema.tags)
          .where(eq(schema.tags.slug, slug))
          .limit(1);

        if (!existingTag) {
          [existingTag] = await db
            .insert(schema.tags)
            .values({ name: tagName, slug })
            .onConflictDoNothing()
            .returning();
        }

        if (existingTag) {
          await db
            .insert(schema.resourceTags)
            .values({ resourceId, tagId: existingTag.id })
            .onConflictDoNothing();
        }
      }
    }

    await AuditService.log({
      userId: req.user!.id,
      action: 'RESOURCE_UPLOADED',
      targetType: 'resource',
      targetId: resourceId,
      metadata: { originalName: fileName, size: fileBuffer.length },
      ipAddress: req.ip,
    });

    return reply.status(201).send({
      success: true,
      data: createdResource,
      message: 'Resource uploaded and published successfully!',
    });
  });

  // 5. Secure Streaming File Download
  app.get('/:id/download', async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    const [record] = await db
      .select({
        resourceId: schema.resources.id,
        title: schema.resources.title,
        visibility: schema.resources.visibility,
        status: schema.resources.status,
        userId: schema.resources.userId,
        fileId: schema.resourceFiles.id,
        originalName: schema.resourceFiles.originalName,
        storageKey: schema.resourceFiles.storageKey,
        mimeType: schema.resourceFiles.mimeType,
        fileSize: schema.resourceFiles.fileSize,
        checksum: schema.resourceFiles.checksumSha256,
      })
      .from(schema.resources)
      .innerJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.resources.id, id))
      .limit(1);

    if (!record) {
      return reply.status(404).send({ success: false, error: 'Resource or file not found.' });
    }

    // Permission check for downloads
    if (record.visibility === 'private' || record.status !== 'approved') {
      const isAuthor = req.user?.id === record.userId;
      const isModOrAdmin = req.user && ['moderator', 'admin'].includes(req.user.role);
      if (!isAuthor && !isModOrAdmin) {
        return reply.status(403).send({ success: false, error: 'Unauthorized to download this resource.' });
      }
    }

    const storage = getStorageDriver();
    const stream = await storage.getStream(record.storageKey);

    // Track download event
    await db.insert(schema.downloadEvents).values({
      resourceId: record.resourceId,
      userId: req.user?.id || null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    });

    // Increment download count
    await db
      .update(schema.resources)
      .set({ downloadCount: sql`${schema.resources.downloadCount} + 1` })
      .where(eq(schema.resources.id, record.resourceId));

    // Headers for streaming download
    reply.header('Content-Type', record.mimeType);
    reply.header('Content-Length', record.fileSize);
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(record.originalName)}"`);
    reply.header('ETag', `"${record.checksum}"`);
    reply.header('Cache-Control', 'public, max-age=3600');

    return reply.send(stream);
  });

  // 6. In-Browser File Stream / Preview for PDFs and Images
  app.get('/:id/preview', async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    const [record] = await db
      .select({
        resourceId: schema.resources.id,
        visibility: schema.resources.visibility,
        status: schema.resources.status,
        userId: schema.resources.userId,
        storageKey: schema.resourceFiles.storageKey,
        mimeType: schema.resourceFiles.mimeType,
        fileSize: schema.resourceFiles.fileSize,
      })
      .from(schema.resources)
      .innerJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.resources.id, id))
      .limit(1);

    if (!record) {
      return reply.status(404).send({ success: false, error: 'Resource not found.' });
    }

    if (record.visibility === 'private' || record.status !== 'approved') {
      const isAuthor = req.user?.id === record.userId;
      const isModOrAdmin = req.user && ['moderator', 'admin'].includes(req.user.role);
      if (!isAuthor && !isModOrAdmin) {
        return reply.status(403).send({ success: false, error: 'Unauthorized.' });
      }
    }

    const storage = getStorageDriver();
    const stream = await storage.getStream(record.storageKey);

    reply.header('Content-Type', record.mimeType);
    reply.header('Content-Length', record.fileSize);
    reply.header('Content-Disposition', 'inline');
    reply.header('Cache-Control', 'public, max-age=7200');

    return reply.send(stream);
  });

  // 7. Stream Thumbnail
  app.get('/thumbnail/:key', async (req, reply) => {
    const { key } = req.params as { key: string };
    const storage = getStorageDriver();

    try {
      const stream = await storage.getStream(key);
      reply.header('Content-Type', 'image/webp');
      reply.header('Cache-Control', 'public, max-age=86400');
      return reply.send(stream);
    } catch {
      return reply.status(404).send({ success: false, error: 'Thumbnail not found.' });
    }
  });

  // 8. Toggle Bookmark
  app.post('/:id/bookmark', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    const [existing] = await db
      .select({ id: schema.bookmarks.id })
      .from(schema.bookmarks)
      .where(and(eq(schema.bookmarks.userId, req.user!.id), eq(schema.bookmarks.resourceId, id)))
      .limit(1);

    if (existing) {
      // Remove bookmark
      await db.delete(schema.bookmarks).where(eq(schema.bookmarks.id, existing.id));
      await db
        .update(schema.resources)
        .set({ bookmarkCount: sql`GREATEST(${schema.resources.bookmarkCount} - 1, 0)` })
        .where(eq(schema.resources.id, id));

      return reply.send({ success: true, bookmarked: false, message: 'Bookmark removed.' });
    } else {
      // Add bookmark
      await db.insert(schema.bookmarks).values({
        userId: req.user!.id,
        resourceId: id,
      });
      await db
        .update(schema.resources)
        .set({ bookmarkCount: sql`${schema.resources.bookmarkCount} + 1` })
        .where(eq(schema.resources.id, id));

      return reply.send({ success: true, bookmarked: true, message: 'Resource bookmarked!' });
    }
  });

  // 9. Update Resource Metadata
  app.patch('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = updateResourceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.issues[0]?.message });
    }

    const db = await getDb();
    const [resRecord] = await db
      .select({ userId: schema.resources.userId })
      .from(schema.resources)
      .where(eq(schema.resources.id, id))
      .limit(1);

    if (!resRecord) {
      return reply.status(404).send({ success: false, error: 'Resource not found.' });
    }

    const isAuthor = resRecord.userId === req.user!.id;
    const isModOrAdmin = ['moderator', 'admin'].includes(req.user!.role);
    if (!isAuthor && !isModOrAdmin) {
      return reply.status(403).send({ success: false, error: 'You are not authorized to edit this resource.' });
    }

    const [updated] = await db
      .update(schema.resources)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(schema.resources.id, id))
      .returning();

    return reply.send({ success: true, data: updated });
  });

  // 10. Delete Resource
  app.delete('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = await getDb();

    const [resRecord] = await db
      .select({
        id: schema.resources.id,
        userId: schema.resources.userId,
        storageKey: schema.resourceFiles.storageKey,
      })
      .from(schema.resources)
      .leftJoin(schema.resourceFiles, eq(schema.resources.id, schema.resourceFiles.resourceId))
      .where(eq(schema.resources.id, id))
      .limit(1);

    if (!resRecord) {
      return reply.status(404).send({ success: false, error: 'Resource not found.' });
    }

    const isAuthor = resRecord.userId === req.user!.id;
    const isModOrAdmin = ['moderator', 'admin'].includes(req.user!.role);
    if (!isAuthor && !isModOrAdmin) {
      return reply.status(403).send({ success: false, error: 'You are not authorized to delete this resource.' });
    }

    // Delete underlying physical file
    if (resRecord.storageKey) {
      try {
        const storage = getStorageDriver();
        await storage.delete(resRecord.storageKey);
      } catch (err) {
        console.warn('Failed to delete file from storage:', (err as Error).message);
      }
    }

    // Cascades delete in database
    await db.delete(schema.resources).where(eq(schema.resources.id, id));

    await AuditService.log({
      userId: req.user!.id,
      action: 'RESOURCE_DELETED',
      targetType: 'resource',
      targetId: id,
      ipAddress: req.ip,
    });

    return reply.send({ success: true, message: 'Resource deleted successfully.' });
  });
};
