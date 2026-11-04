import { pgTable, uuid, varchar, text, integer, bigint, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { categories, tags } from './categories.js';

export const resources = pgTable(
  'resources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    subject: varchar('subject', { length: 100 }).notNull(),
    academicLevel: varchar('academic_level', { length: 50 }).notNull(),
    institution: varchar('institution', { length: 150 }),
    visibility: varchar('visibility', { length: 20 }).notNull().default('public'), // public, unlisted, private
    status: varchar('status', { length: 20 }).notNull().default('approved'), // pending, approved, rejected
    downloadCount: integer('download_count').notNull().default(0),
    bookmarkCount: integer('bookmark_count').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),
    thumbnailUrl: text('thumbnail_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_resources_status_visibility').on(table.status, table.visibility),
    index('idx_resources_category').on(table.categoryId),
    index('idx_resources_user').on(table.userId),
    index('idx_resources_created_at').on(table.createdAt),
    index('idx_resources_downloads').on(table.downloadCount),
  ]
);

export const resourceFiles = pgTable('resource_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resources.id, { onDelete: 'cascade' }),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  fileExtension: varchar('file_extension', { length: 20 }).notNull(),
  checksumSha256: varchar('checksum_sha256', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const resourceTags = pgTable(
  'resource_tags',
  {
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.resourceId, table.tagId] })]
);

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [resources.categoryId],
    references: [categories.id],
  }),
  file: one(resourceFiles, {
    fields: [resources.id],
    references: [resourceFiles.resourceId],
  }),
  tags: many(resourceTags),
}));

export const resourceTagsRelations = relations(resourceTags, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceTags.resourceId],
    references: [resources.id],
  }),
  tag: one(tags, {
    fields: [resourceTags.tagId],
    references: [tags.id],
  }),
}));
