/* eslint-disable @typescript-eslint/no-explicit-any */
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

import { DEFAULT_PROMPT_TEMPLATES, renderPrompt } from '../prompts/templates';
import type {
  DeepDiveContext,
  DeepDiveResponse,
  InsightInterpretation,
  StructuredForecastInput,
  StructuredInsightInput,
} from '../types';
import { BaseAnalyticsProvider } from './base';

const insightInterpretationSchema = z.object({
  title: z.string(),
  message: z.string(),
  reason: z.string().optional(),
  impact: z.string().optional(),
  recommendation: z.string().optional(),
});

const insightInterpretationArraySchema = z.array(insightInterpretationSchema);

const forecastExplanationSchema = z.object({
  explanation: z.string(),
});

const deepDiveResponseSchema = z.object({
  answer: z.string(),
  suggestedFollowUps: z.array(z.string()),
});

export class GeminiAnalyticsProvider extends BaseAnalyticsProvider {
  readonly name = 'gemini';
  private readonly model;

  constructor(apiKey?: string) {
    super();
    const resolvedApiKey =
      apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const config = resolvedApiKey ? { apiKey: resolvedApiKey } : {};
    const google = createGoogleGenerativeAI(config);
    this.model = google('gemini-3.5-flash');
  }

  async interpretInsights(
    facts: StructuredInsightInput[],
    currency: string,
  ): Promise<InsightInterpretation[]> {
    if (facts.length === 0) return [];

    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'interpret_insights');
    if (!template) return facts.map((f) => ({ title: f.title, message: f.message }));

    const prompt = renderPrompt(template.template, {
      insights: JSON.stringify(facts),
      currency,
    });

    try {
      const { object } = await generateObject({
        model: this.model as any,
        schema: insightInterpretationArraySchema as any,
        prompt,
      });

      return object as InsightInterpretation[];
    } catch (error) {
      console.error('[GeminiProvider] interpretInsights failed:', error);
      // Fallback: pass through the facts
      return facts.map((f) => ({
        title: f.title,
        message: f.message,
        reason: 'Provider error',
      }));
    }
  }

  async interpretForecast(
    forecast: StructuredForecastInput,
    currency: string,
  ): Promise<{ explanation: string }> {
    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'interpret_forecast');
    if (!template) return { explanation: 'Provider template not found.' };

    const prompt = renderPrompt(template.template, {
      forecast: JSON.stringify(forecast),
      currency,
    });

    try {
      const { object } = await generateObject({
        model: this.model as any,
        schema: forecastExplanationSchema as any,
        prompt,
      });

      return object as { explanation: string };
    } catch (error) {
      console.error('[GeminiProvider] interpretForecast failed:', error);
      return {
        explanation: 'Forecast explanation unavailable due to a provider error.',
      };
    }
  }

  async deepDive(context: DeepDiveContext & { currency: string }): Promise<DeepDiveResponse> {
    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'deep_dive');
    if (!template) {
      return {
        answer: 'I am unable to answer that right now.',
        suggestedFollowUps: [],
      };
    }

    const prompt = renderPrompt(template.template, {
      question: context.question,
      insight: JSON.stringify(context.insight),
      expenses: JSON.stringify(context.expenses.slice(0, 50)),
      currency: context.currency,
    });

    try {
      const { object } = await generateObject({
        model: this.model as any,
        schema: deepDiveResponseSchema as any,
        prompt,
      });

      return object as DeepDiveResponse;
    } catch (error) {
      console.error('[GeminiProvider] deepDive failed:', error);
      return {
        answer:
          'I encountered an error trying to analyze this insight. Please try asking your question again later.',
        suggestedFollowUps: [],
      };
    }
  }

  async recommendBudgets(context: { expenses: any[]; categories: string[]; currency: string }) {
    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'recommend_budgets');
    if (!template) return [];

    const prompt = renderPrompt(template.template, {
      expenses: JSON.stringify(context.expenses),
      categories: JSON.stringify(context.categories),
      currency: context.currency,
    });

    try {
      const { object } = await generateObject({
        model: this.model as any,
        schema: z.array(
          z.object({
            categoryId: z.string(),
            recommendedAmount: z.number(),
            explanation: z.string(),
          }),
        ) as any,
        prompt,
      });

      return object as any;
    } catch (error) {
      console.error('[GeminiProvider] recommendBudgets failed:', error);
      return [];
    }
  }
}
