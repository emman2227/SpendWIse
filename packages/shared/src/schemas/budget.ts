import { z } from 'zod';

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1),
  limitAmount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000)
});

export const updateBudgetSchema = createBudgetSchema.partial();
