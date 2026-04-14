import { z } from 'zod';

import { isoDateSchema } from './common';

export const createGoalSchema = z.object({
  title: z.string().min(2).max(120),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  targetDate: isoDateSchema,
  notes: z.string().max(300).optional(),
});

export const updateGoalSchema = createGoalSchema.partial();
