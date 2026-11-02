/* eslint-disable @typescript-eslint/no-explicit-any */
import { Buffer } from 'node:buffer';
import process from 'node:process';

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
import { DeterministicAnalyticsProvider } from './deterministic-provider';

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
  private readonly fallback = new DeterministicAnalyticsProvider();

  constructor(apiKey?: string) {
    super();
    const resolvedApiKey =
      apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const config = resolvedApiKey ? { apiKey: resolvedApiKey } : {};
    const google = createGoogleGenerativeAI(config);
    this.model = google('gemini-3.8-flash');
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
      console.warn(
        '[GeminiProvider] interpretInsights failed, falling back to deterministic:',
        error,
      );
      return this.fallback.interpretInsights(facts, currency);
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
      console.warn(
        '[GeminiProvider] interpretForecast failed, falling back to deterministic:',
        error,
      );
      return this.fallback.interpretForecast(forecast, currency);
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
      console.warn('[GeminiProvider] deepDive failed, falling back to deterministic:', error);
      return this.fallback.deepDive(context);
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
      console.warn(
        '[GeminiProvider] recommendBudgets failed, falling back to deterministic:',
        error,
      );
      return this.fallback.recommendBudgets(context);
    }
  }

  async parseReceipt(
    imageBase64: string,
    mimeType: string,
    categories: Array<{ id: string; name: string }>,
  ) {
    const receiptSchema = z.object({
      merchant: z.string().describe('Merchant or business name'),
      amount: z.number().positive().describe('Total numeric charge amount'),
      date: z.string().describe('Transaction date in ISO format or YYYY-MM-DD'),
      categoryName: z
        .string()
        .optional()
        .describe('Best matching category from the available list'),
      confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
      paymentMethod: z
        .enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet'])
        .optional(),
      lineItems: z.array(z.object({ description: z.string(), amount: z.number() })).optional(),
      notes: z.string().optional(),
    });

    const categoryNames = categories.map((c) => c.name);
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    try {
      const { object } = await generateObject({
        model: this.model as any,
        schema: receiptSchema as any,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert AI financial scanner. Analyze this receipt or bill image. Extract the merchant name, total transaction amount, date, payment method, and line items. Match it to one of these user categories if appropriate: ${JSON.stringify(categoryNames)}. If unsure, set categoryName to null.`,
              },
              {
                type: 'image',
                image: imageBuffer,
                mediaType: mimeType || 'image/jpeg',
              },
            ],
          },
        ] as any,
      });

      const parsed = object as any;
      const matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === (parsed.categoryName || '').toLowerCase(),
      );

      return {
        merchant: parsed.merchant,
        amount: parsed.amount,
        date: parsed.date || new Date().toISOString(),
        categoryId: matchedCategory?.id,
        categoryName: matchedCategory?.name || parsed.categoryName,
        confidence: parsed.confidence ?? 0.85,
        paymentMethod: parsed.paymentMethod,
        lineItems: parsed.lineItems,
        notes: parsed.notes || `Scanned receipt from ${parsed.merchant}`,
      };
    } catch (error) {
      console.warn(
        '[GeminiProvider] parseReceipt failed, falling back to deterministic OCR provider:',
        error,
      );
      return this.fallback.parseReceipt(imageBase64, mimeType, categories);
    }
  }

  async parseCsvTransactions(csvContent: string, categories: Array<{ id: string; name: string }>) {
    const csvArraySchema = z.array(
      z.object({
        date: z.string(),
        description: z.string(),
        amount: z.number().positive(),
        categoryName: z.string().optional(),
        paymentMethod: z
          .enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet'])
          .optional(),
        notes: z.string().optional(),
      }),
    );

    const categoryNames = categories.map((c) => c.name);
    const prompt = `You are a financial data normalizer. Analyze the following raw CSV or bank statement records. Map each row to a normalized expense with date (YYYY-MM-DD or ISO 8601), clean merchant/description, numeric positive amount, payment method (cash, credit_card, debit_card, bank_transfer, or e_wallet), and best matching category from: ${JSON.stringify(categoryNames)}.
Raw CSV content (first 8000 characters):
${csvContent.slice(0, 8000)}`;

    try {
      const { object } = await generateObject({
        model: this.model as any,
        schema: csvArraySchema as any,
        prompt,
      });

      return ((object as any[]) || []).map((row) => {
        const matched = categories.find(
          (c) => c.name.toLowerCase() === (row.categoryName || '').toLowerCase(),
        );
        return {
          date: row.date || new Date().toISOString(),
          description: row.description || 'Imported Transaction',
          amount: Math.abs(row.amount),
          categoryId: matched?.id || categories[0]?.id,
          paymentMethod: row.paymentMethod || 'debit_card',
          notes: row.notes || 'Imported from bank CSV',
        };
      });
    } catch (error) {
      console.warn(
        '[GeminiProvider] parseCsvTransactions failed, falling back to deterministic:',
        error,
      );
      return this.fallback.parseCsvTransactions(csvContent, categories);
    }
  }

  async suggestCategory(rawDescription: string, categories: Array<{ id: string; name: string }>) {
    const categoryNames = categories.map((c) => c.name);
    const suggestionSchema = z.object({
      normalizedMerchant: z
        .string()
        .describe('Cleaned up merchant name free of terminal IDs and junk codes'),
      categoryName: z.string().optional().describe('Best matching category from the list'),
      confidence: z.number().min(0).max(1),
    });

    const prompt = `Clean the merchant description and suggest a category.
Raw description: "${rawDescription}"
Available categories: ${JSON.stringify(categoryNames)}`;

    try {
      const { object } = await generateObject({
        model: this.model as any,
        schema: suggestionSchema as any,
        prompt,
      });

      const parsed = object as any;
      const matched = categories.find(
        (c) => c.name.toLowerCase() === (parsed.categoryName || '').toLowerCase(),
      );

      return {
        normalizedMerchant: parsed.normalizedMerchant || rawDescription,
        categoryId: matched?.id,
        categoryName: matched?.name || parsed.categoryName,
        confidence: parsed.confidence ?? 0.8,
      };
    } catch (error) {
      console.warn(
        '[GeminiProvider] suggestCategory failed, falling back to deterministic:',
        error,
      );
      return this.fallback.suggestCategory(rawDescription, categories);
    }
  }
}
