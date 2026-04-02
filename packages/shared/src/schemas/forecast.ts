import { z } from 'zod';

import { forecastPeriodSchema } from './common';

export const forecastSchema = z.object({
  id: z.string(),
  userId: z.string(),
  period: forecastPeriodSchema,
  predictedAmount: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  generatedAt: z.string()
});
