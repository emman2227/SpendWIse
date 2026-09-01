import { z } from 'zod';

import { paymentMethodSchema } from './common';

const MAX_FUTURE_BUFFER_MS = 24 * 60 * 60 * 1000; // 24 hours leeway for local/UTC timezone differences
const MAX_PAST_YEARS = 2;

const MAX_EXPENSE_AMOUNT = 100_000_000;
// eslint-disable-next-line no-control-regex
const INVALID_CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export const createExpenseSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0.')
    .max(MAX_EXPENSE_AMOUNT, `Amount cannot exceed ${MAX_EXPENSE_AMOUNT.toLocaleString()}.`),
  categoryId: z.string().min(1, 'Category is required.'),
  description: z
    .string()
    .min(2, 'Description must be at least 2 characters.')
    .max(120, 'Description cannot exceed 120 characters.')
    .refine((val) => !INVALID_CONTROL_CHARS_REGEX.test(val), {
      message: 'Description contains invalid control characters.',
    }),
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
  notes: z
    .string()
    .max(200, 'Notes cannot exceed 200 characters.')
    .refine((val) => !INVALID_CONTROL_CHARS_REGEX.test(val), {
      message: 'Notes contain invalid control characters.',
    })
    .optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  categoryId: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(3000).optional(),
});
