import { z } from 'zod';

import { forecastPeriodSchema, forecastRiskLevelSchema } from './common';

export const categoryForecastSchema = z.object({
  category: z.string(),
  currentAmount: z.number(),
  predictedAmount: z.number(),
  budget: z.number().optional(),
  variance: z.number(),
  riskLevel: forecastRiskLevelSchema,
});

export const forecastRiskSchema = z.object({
  category: z.string(),
  projectedAmount: z.number(),
  budgetAmount: z.number(),
  riskLevel: forecastRiskLevelSchema,
  explanation: z.string(),
});

export const forecastSchema = z.object({
  id: z.string(),
  userId: z.string(),
  period: forecastPeriodSchema,
  currentSpend: z.number().nonnegative(),
  predictedAmount: z.number().nonnegative(),
  lowerBound: z.number().nonnegative(),
  upperBound: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  confidenceExplanation: z.string().optional(),
  categoryForecasts: z.array(categoryForecastSchema),
  risks: z.array(forecastRiskSchema),
  assumptions: z.array(z.string()),
  generatedAt: z.string(),
});
