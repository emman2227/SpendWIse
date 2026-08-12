import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { InsightType } from '@spendwise/shared';
import { generateObject } from 'ai';
import { z } from 'zod';

import { DEFAULT_PROMPT_TEMPLATES, renderPrompt } from '../prompts/templates';
import type { AnalyticsProviderInput, InsightResult } from '../types';
import { BaseAnalyticsProvider } from './base';

const insightSchema = z.object({
  type: z.string(),
  title: z.string(),
  message: z.string(),
  metadata: z
    .object({
      reason: z.string().optional(),
      evidence: z.string().optional(),
    })
    .optional(),
});

const insightArraySchema = z.array(insightSchema);
type InsightArray = z.infer<typeof insightArraySchema>;

const forecastSchema = z.object({
  predictedAmount: z.number(),
  confidence: z.number().min(0).max(1),
  metadata: z
    .object({
      reason: z.string().optional(),
      evidence: z.string().optional(),
    })
    .optional(),
});
type ForecastOutput = z.infer<typeof forecastSchema>;

export class GeminiAnalyticsProvider extends BaseAnalyticsProvider {
  readonly name = 'gemini';
  private readonly model;

  constructor(apiKey?: string) {
    super();
    const google = createGoogleGenerativeAI({
      apiKey: apiKey ?? process.env.GEMINI_API_KEY,
    });
    this.model = google('gemini-2.5-flash');
  }

  async summarizeSpending(input: AnalyticsProviderInput): Promise<InsightResult[]> {
    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'summarize_spending');

    if (!template) {
      return [];
    }

    const prompt = renderPrompt(template.template, {
      expenses: JSON.stringify(input.expenses.slice(0, 50)),
      categories: input.categories ? JSON.stringify(input.categories) : '',
      budgets: input.budgets ? JSON.stringify(input.budgets) : '',
    });

    try {
      const { object } = await generateObject({
        model: this.model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: insightArraySchema as any,
        prompt,
      });

      const items = object as InsightArray;

      return items.map((item) => ({
        type: item.type as InsightResult['type'],
        title: item.title,
        message: item.message,
        metadata: item.metadata
          ? { reason: item.metadata.reason, evidence: item.metadata.evidence }
          : undefined,
      }));
    } catch (error) {
      console.error('[GeminiProvider] summarizeSpending failed:', error);
      return [
        {
          type: 'summary' as const,
          title: 'AI summary unavailable',
          message:
            'The AI provider could not generate a summary at this time. Please try again later.',
          metadata: { reason: 'Provider error' },
        },
      ];
    }
  }

  async detectAnomalies(input: AnalyticsProviderInput): Promise<InsightResult[]> {
    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'detect_anomalies');

    if (!template) {
      return [];
    }

    const prompt = renderPrompt(template.template, {
      expenses: JSON.stringify(input.expenses.slice(0, 50)),
      categories: input.categories ? JSON.stringify(input.categories) : '',
    });

    try {
      const { object } = await generateObject({
        model: this.model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: insightArraySchema as any,
        prompt,
      });

      const items = object as InsightArray;

      return items.map((item) => ({
        type: item.type as InsightResult['type'],
        title: item.title,
        message: item.message,
        metadata: item.metadata
          ? { reason: item.metadata.reason, evidence: item.metadata.evidence }
          : undefined,
      }));
    } catch (error) {
      console.error('[GeminiProvider] detectAnomalies failed:', error);
      return [
        {
          type: 'trend' as const,
          title: 'Anomaly detection unavailable',
          message:
            'The AI provider could not analyze anomalies at this time. Please try again later.',
          metadata: { reason: 'Provider error' },
        },
      ];
    }
  }

  async forecast(input: AnalyticsProviderInput) {
    const period = input.period ?? 'monthly';
    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'forecast');

    if (!template) {
      return {
        userId: input.userId,
        period,
        predictedAmount: 0,
        confidence: 0,
      };
    }

    const prompt = renderPrompt(template.template, {
      expenses: JSON.stringify(input.expenses.slice(0, 50)),
      period,
    });

    try {
      const { object } = await generateObject({
        model: this.model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema: forecastSchema as any,
        prompt,
      });

      const output = object as ForecastOutput;

      return {
        userId: input.userId,
        period,
        predictedAmount: Number(output.predictedAmount.toFixed(2)),
        confidence: Number(output.confidence.toFixed(2)),
      };
    } catch (error) {
      console.error('[GeminiProvider] forecast failed:', error);
      // Fallback: simple average-based estimate
      const total = input.expenses.reduce((sum, e) => sum + e.amount, 0);
      const avg = input.expenses.length > 0 ? total / input.expenses.length : 0;
      const multiplier = period === 'weekly' ? 7 : period === 'quarterly' ? 90 : 30;

      return {
        userId: input.userId,
        period,
        predictedAmount: Number((avg * (multiplier / 3)).toFixed(2)),
        confidence: 0.3,
      };
    }
  }

  async generateInsight(type: InsightType, title: string, message: string): Promise<InsightResult> {
    return {
      type,
      title,
      message,
    };
  }
}
