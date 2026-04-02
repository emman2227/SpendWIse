import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(50),
  icon: z.string().min(1).max(30).default('wallet'),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Expected a hex color')
});

export const updateCategorySchema = createCategorySchema.partial();
