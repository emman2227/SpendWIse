import { z } from 'zod';

const MAX_BUDGET_AMOUNT = 100_000_000;

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required.'),
  limitAmount: z
    .number()
    .positive('Budget limit must be greater than 0.')
    .max(MAX_BUDGET_AMOUNT, `Budget limit cannot exceed ${MAX_BUDGET_AMOUNT.toLocaleString()}.`),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000),
});

export const updateBudgetSchema = createBudgetSchema.partial();
