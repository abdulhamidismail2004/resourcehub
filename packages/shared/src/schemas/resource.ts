import { z } from 'zod';

export const createResourceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters').trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters').trim(),
  categoryId: z.string().uuid('Invalid category ID'),
  subject: z.string().min(2, 'Subject must be at least 2 characters').max(80).trim(),
  academicLevel: z.enum(['primary', 'secondary', 'high_school', 'undergraduate', 'postgraduate', 'professional', 'all']),
  institution: z.string().max(100).optional().nullable(),
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
  tags: z.array(z.string().trim().min(1).max(30)).max(10, 'Maximum 10 tags allowed').optional().default([]),
});

export const updateResourceSchema = createResourceSchema.partial();

export const searchResourceSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tag: z.string().optional(),
  academicLevel: z.string().optional(),
  subject: z.string().optional(),
  fileExtension: z.string().optional(),
  sortBy: z.enum(['recent', 'downloads', 'bookmarks', 'views', 'title']).default('recent'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type SearchResourceInput = z.infer<typeof searchResourceSchema>;
