import type {
  CategorySuggestion,
  Expense,
  Forecast,
  Insight,
  ParsedCsvRow,
  ParsedReceiptResult,
} from '@spendwise/shared';

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
  interpretInsights(
    facts: StructuredInsightInput[],
    currency: string,
  ): Promise<InsightInterpretation[]>;
  interpretForecast(
    forecast: StructuredForecastInput,
    currency: string,
  ): Promise<{ explanation: string }>;
  deepDive(context: DeepDiveContext & { currency: string }): Promise<DeepDiveResponse>;
  recommendBudgets(context: {
    expenses: Expense[];
    categories: string[];
    currency: string;
  }): Promise<Array<{ categoryId: string; recommendedAmount: number; explanation: string }>>;
  parseReceipt(
    imageBase64: string,
    mimeType: string,
    categories: Array<{ id: string; name: string }>,
  ): Promise<ParsedReceiptResult>;
  parseCsvTransactions(
    csvContent: string,
    categories: Array<{ id: string; name: string }>,
  ): Promise<ParsedCsvRow[]>;
  suggestCategory(
    rawDescription: string,
    categories: Array<{ id: string; name: string }>,
  ): Promise<CategorySuggestion>;
}
