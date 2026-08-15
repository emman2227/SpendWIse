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
}
