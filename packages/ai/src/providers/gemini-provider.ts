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
    const google = createGoogleGenerativeAI({
      apiKey: apiKey ?? process.env.GEMINI_API_KEY,
    });
    this.model = google('gemini-2.5-flash');
  }

  async interpretInsights(facts: StructuredInsightInput[]): Promise<InsightInterpretation[]> {
    if (facts.length === 0) return [];

    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'interpret_insights');
    if (!template) return facts.map((f) => ({ title: f.title, message: f.message }));

    const prompt = renderPrompt(template.template, {
      facts: JSON.stringify(facts),
    });

    try {
      const { object } = await generateObject({
        model: this.model,
        schema: insightInterpretationArraySchema,
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

  async interpretForecast(forecast: StructuredForecastInput): Promise<{ explanation: string }> {
    const template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === 'interpret_forecast');
    if (!template) return { explanation: 'Provider template not found.' };

    const prompt = renderPrompt(template.template, {
      forecast: JSON.stringify(forecast),
    });

    try {
      const { object } = await generateObject({
        model: this.model,
        schema: forecastExplanationSchema,
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

  async deepDive(context: DeepDiveContext): Promise<DeepDiveResponse> {
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
    });

    try {
      const { object } = await generateObject({
        model: this.model,
        schema: deepDiveResponseSchema,
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
}
