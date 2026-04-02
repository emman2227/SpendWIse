import type { Expense, Forecast, ForecastPeriod, Insight, InsightType } from '@spendwise/shared';

export interface AnalyticsContext {
  userId: string;
  expenses: Expense[];
  categories?: Record<string, string>;
  budgets?: Array<{
    categoryId: string;
    limitAmount: number;
  }>;
}

export interface AnalyticsProviderInput extends AnalyticsContext {
  period?: ForecastPeriod;
}

export interface AnalyticsProvider {
  readonly name: string;
  summarizeSpending(input: AnalyticsProviderInput): Promise<Pick<Insight, 'type' | 'title' | 'message'>[]>;
  detectAnomalies(input: AnalyticsProviderInput): Promise<Pick<Insight, 'type' | 'title' | 'message'>[]>;
  forecast(input: AnalyticsProviderInput): Promise<Omit<Forecast, 'id' | 'generatedAt'>>;
  generateInsight(
    type: InsightType,
    title: string,
    message: string,
  ): Promise<Pick<Insight, 'type' | 'title' | 'message'>>;
}
