import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(30, 'Name cannot exceed 30 characters.'),
  icon: z.string().min(1, 'Icon is required.').max(30).default('wallet'),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Expected a valid 6-character hex color.'),
});

export const updateCategorySchema = createCategorySchema.partial();
