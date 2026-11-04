import { z } from 'zod';

export const createReportSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
  reason: z.enum(['copyright', 'inappropriate', 'spam', 'low_quality', 'broken_file', 'other']),
  details: z.string().max(1000).optional().nullable(),
});

export const moderationActionSchema = z.object({
  targetType: z.enum(['resource', 'user', 'report']),
  targetId: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'suspend', 'unsuspend', 'resolve_report', 'dismiss_report']),
  note: z.string().max(500).optional().nullable(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin']),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
