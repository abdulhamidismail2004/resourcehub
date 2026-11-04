import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { resources } from './resources.js';

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resources.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 50 }).notNull(),
  details: text('details'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, resolved, dismissed
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const moderationActions = pgTable('moderation_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  moderatorId: uuid('moderator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetType: varchar('target_type', { length: 50 }).notNull(), // resource, user, report
  targetId: uuid('target_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: uuid('target_id'),
  metadata: text('metadata'), // json serialized
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
