import { z } from 'zod';

import { paymentMethodSchema } from './common';

const MAX_FUTURE_BUFFER_MS = 24 * 60 * 60 * 1000; // 24 hours leeway for local/UTC timezone differences
const MAX_PAST_YEARS = 2;

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  description: z.string().min(2).max(120),
  paymentMethod: paymentMethodSchema,
  date: z
    .string()
    .datetime({ offset: true })
    .refine(
      (val) => {
        const timestamp = new Date(val).getTime();
        return timestamp <= Date.now() + MAX_FUTURE_BUFFER_MS;
      },
      { message: 'Expense date cannot be in the future.' },
    )
    .refine(
      (val) => {
        const expenseDate = new Date(val);
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - MAX_PAST_YEARS);
        minDate.setHours(0, 0, 0, 0);
        return expenseDate.getTime() >= minDate.getTime();
      },
      { message: 'Expense date cannot be older than 2 years.' },
    ),
  notes: z.string().max(300).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  categoryId: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(3000).optional(),
});
