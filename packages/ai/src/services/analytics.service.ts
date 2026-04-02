import type { Expense, Forecast, ForecastPeriod, Insight } from '@spendwise/shared';

import type { AnalyticsProvider } from '../types';

export class AnalyticsService {
  constructor(private readonly provider: AnalyticsProvider) {}

  async buildInsights(userId: string, expenses: Expense[]): Promise<Insight[]> {
    const [summaries, anomalies] = await Promise.all([
      this.provider.summarizeSpending({ userId, expenses }),
      this.provider.detectAnomalies({ userId, expenses })
    ]);

    return [...summaries, ...anomalies].map((entry, index) => ({
      id: `insight-${index + 1}`,
      userId,
      type: entry.type,
      title: entry.title,
      message: entry.message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  async forecast(userId: string, expenses: Expense[], period: ForecastPeriod = 'monthly'): Promise<Forecast> {
    const prediction = await this.provider.forecast({ userId, expenses, period });

    return {
      id: `forecast-${period}`,
      generatedAt: new Date().toISOString(),
      ...prediction
    };
  }
}
