import { z } from 'zod';

import { paymentMethodSchema } from './common';

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  description: z.string().min(2).max(120),
  paymentMethod: paymentMethodSchema,
  date: z.string().datetime({ offset: true }),
  notes: z.string().max(300).optional()
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  categoryId: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(3000).optional()
});
