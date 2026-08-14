import { z } from 'zod';

import {
  FORECAST_PERIODS,
  FORECAST_RISK_LEVELS,
  INSIGHT_SEVERITIES,
  INSIGHT_TYPES,
  PAYMENT_METHODS,
} from '../constants/app';

export const objectIdSchema = z.string().min(1);
export const isoDateSchema = z.string().datetime({ offset: true });
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const insightTypeSchema = z.enum(INSIGHT_TYPES);
export const insightSeveritySchema = z.enum(INSIGHT_SEVERITIES);
export const forecastPeriodSchema = z.enum(FORECAST_PERIODS);
export const forecastRiskLevelSchema = z.enum(FORECAST_RISK_LEVELS);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
