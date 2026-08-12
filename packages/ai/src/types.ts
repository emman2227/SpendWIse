import type {
  Expense,
  Forecast,
  ForecastPeriod,
  Insight,
  InsightMetadata,
  InsightType,
} from '@spendwise/shared';

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

export interface InsightResult {
  type: Insight['type'];
  title: string;
  message: string;
  metadata?: InsightMetadata;
}

export interface AnalyticsProvider {
  readonly name: string;
  summarizeSpending(input: AnalyticsProviderInput): Promise<InsightResult[]>;
  detectAnomalies(input: AnalyticsProviderInput): Promise<InsightResult[]>;
  forecast(input: AnalyticsProviderInput): Promise<Omit<Forecast, 'id' | 'generatedAt'>>;
  generateInsight(type: InsightType, title: string, message: string): Promise<InsightResult>;
}
