import type { AnalyticsProvider } from '../types';

export abstract class BaseAnalyticsProvider implements AnalyticsProvider {
  abstract readonly name: string;

  abstract summarizeSpending: AnalyticsProvider['summarizeSpending'];
  abstract detectAnomalies: AnalyticsProvider['detectAnomalies'];
  abstract forecast: AnalyticsProvider['forecast'];
  abstract generateInsight: AnalyticsProvider['generateInsight'];
}
