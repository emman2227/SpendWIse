import type { AnalyticsProvider, InsightResult } from '../types';

export abstract class BaseAnalyticsProvider implements AnalyticsProvider {
  abstract readonly name: string;

  abstract summarizeSpending(
    ...args: Parameters<AnalyticsProvider['summarizeSpending']>
  ): Promise<InsightResult[]>;
  abstract detectAnomalies(
    ...args: Parameters<AnalyticsProvider['detectAnomalies']>
  ): Promise<InsightResult[]>;
  abstract forecast(
    ...args: Parameters<AnalyticsProvider['forecast']>
  ): ReturnType<AnalyticsProvider['forecast']>;
  abstract generateInsight(
    ...args: Parameters<AnalyticsProvider['generateInsight']>
  ): Promise<InsightResult>;
}
