import type { Expense, Forecast, Insight } from '@spendwise/shared';

export interface AnalyticsContext {
  userId: string;
}

export type StructuredInsightInput = Omit<Insight, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type StructuredForecastInput = Omit<Forecast, 'id' | 'userId' | 'generatedAt'>;

export interface InsightInterpretation {
  title: string;
  message: string;
  reason?: string;
  impact?: string;
  recommendation?: string;
}

export interface DeepDiveContext {
  insight: Insight;
  question: string;
  expenses: Expense[];
}

export interface DeepDiveResponse {
  answer: string;
  suggestedFollowUps: string[];
}

export interface AnalyticsProvider {
  readonly name: string;
  interpretInsights(facts: StructuredInsightInput[]): Promise<InsightInterpretation[]>;
  interpretForecast(forecast: StructuredForecastInput): Promise<{ explanation: string }>;
  deepDive(context: DeepDiveContext): Promise<DeepDiveResponse>;
}
