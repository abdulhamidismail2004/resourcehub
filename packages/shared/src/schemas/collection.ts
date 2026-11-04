import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name cannot exceed 80 characters').trim(),
  description: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().default(false),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const addCollectionItemSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type AddCollectionItemInput = z.infer<typeof addCollectionItemSchema>;
