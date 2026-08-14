import { z } from 'zod';

import { insightSeveritySchema, insightTypeSchema } from './common';

export const insightEvidenceSchema = z
  .object({
    currentSpend: z.number().optional(),
    averageSpend: z.number().optional(),
    percentChange: z.number().optional(),
    budget: z.number().optional(),
    budgetUtilization: z.number().optional(),
    transactionCount: z.number().optional(),
    unusualTransactionCount: z.number().optional(),
    comparisonPeriod: z.string().optional(),
  })
  .passthrough();

export const insightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: insightTypeSchema,
  severity: insightSeveritySchema,
  category: z.string().optional(),
  title: z.string(),
  message: z.string(),
  reason: z.string().optional(),
  evidence: insightEvidenceSchema.optional(),
  impact: z.string().optional(),
  recommendation: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
