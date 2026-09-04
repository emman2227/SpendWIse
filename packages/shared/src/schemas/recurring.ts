import { z } from 'zod';

import { isoDateSchema, paymentMethodSchema } from './common';

export const recurringCadenceSchema = z.enum([
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
]);

export type RecurringCadence = z.infer<typeof recurringCadenceSchema>;

export const createRecurringExpenseSchema = z.object({
  description: z.string().trim().min(2, 'Description must be at least 2 characters').max(120),
  amount: z.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  cadence: recurringCadenceSchema,
  nextDueDate: isoDateSchema,
  paymentMethod: paymentMethodSchema.default('credit_card'),
  isActive: z.boolean().default(true),
  notes: z.string().max(300).optional(),
});

export const updateRecurringExpenseSchema = createRecurringExpenseSchema.partial();

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>;

export interface RecurringExpense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  categoryId: string;
  cadence: RecurringCadence;
  nextDueDate: string;
  paymentMethod: z.infer<typeof paymentMethodSchema>;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
