import type { AnalyticsProvider } from '../types';

export abstract class BaseAnalyticsProvider implements AnalyticsProvider {
  abstract readonly name: string;

  abstract interpretInsights(
    ...args: Parameters<AnalyticsProvider['interpretInsights']>
  ): ReturnType<AnalyticsProvider['interpretInsights']>;

  abstract interpretForecast(
    ...args: Parameters<AnalyticsProvider['interpretForecast']>
  ): ReturnType<AnalyticsProvider['interpretForecast']>;

  abstract deepDive(
    ...args: Parameters<AnalyticsProvider['deepDive']>
  ): ReturnType<AnalyticsProvider['deepDive']>;

  abstract recommendBudgets(
    ...args: Parameters<AnalyticsProvider['recommendBudgets']>
  ): ReturnType<AnalyticsProvider['recommendBudgets']>;

  abstract parseReceipt(
    ...args: Parameters<AnalyticsProvider['parseReceipt']>
  ): ReturnType<AnalyticsProvider['parseReceipt']>;

  abstract parseCsvTransactions(
    ...args: Parameters<AnalyticsProvider['parseCsvTransactions']>
  ): ReturnType<AnalyticsProvider['parseCsvTransactions']>;

  abstract suggestCategory(
    ...args: Parameters<AnalyticsProvider['suggestCategory']>
  ): ReturnType<AnalyticsProvider['suggestCategory']>;
}
