import type { AnalyticsProvider } from '../types';

export abstract class BaseAnalyticsProvider implements AnalyticsProvider {
  abstract readonly name: string;

  abstract summarizeSpending(...args: Parameters<AnalyticsProvider['summarizeSpending']>): ReturnType<AnalyticsProvider['summarizeSpending']>;
  abstract detectAnomalies(...args: Parameters<AnalyticsProvider['detectAnomalies']>): ReturnType<AnalyticsProvider['detectAnomalies']>;
  abstract forecast(...args: Parameters<AnalyticsProvider['forecast']>): ReturnType<AnalyticsProvider['forecast']>;
  abstract generateInsight(...args: Parameters<AnalyticsProvider['generateInsight']>): ReturnType<AnalyticsProvider['generateInsight']>;
}
