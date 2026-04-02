import type { ForecastPeriod, InsightType } from '@spendwise/shared';

import { BaseAnalyticsProvider } from './base';
import type { AnalyticsProviderInput } from '../types';

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const formatPeriod = (period: ForecastPeriod) => {
  switch (period) {
    case 'weekly':
      return 'next week';
    case 'quarterly':
      return 'next quarter';
    case 'monthly':
    default:
      return 'next month';
  }
};

export class MockAiProvider extends BaseAnalyticsProvider {
  readonly name = 'mock-ai-provider';

  async summarizeSpending(input: AnalyticsProviderInput) {
    const total = input.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = Object.entries(
      input.expenses.reduce<Record<string, number>>((accumulator, expense) => {
        accumulator[expense.categoryId] = (accumulator[expense.categoryId] ?? 0) + expense.amount;
        return accumulator;
      }, {}),
    ).sort((left, right) => right[1] - left[1]);

    const topCategory = categoryTotals[0];

    return [
      {
        type: 'summary' as const,
        title: 'Spending snapshot',
        message: topCategory
          ? `You spent ${total.toFixed(2)} overall, with the highest share going to ${topCategory[0]}.`
          : 'You do not have enough expenses yet to form a spending snapshot.'
      }
    ];
  }

  async detectAnomalies(input: AnalyticsProviderInput) {
    const amounts = input.expenses.map((expense) => expense.amount);
    const mean = average(amounts);
    const anomalies = input.expenses.filter((expense) => expense.amount > mean * 1.8 && mean > 0);

    if (anomalies.length === 0) {
      return [
        {
          type: 'trend' as const,
          title: 'Spending is within routine range',
          message: 'No unusually large transactions were detected based on the current rolling average.'
        }
      ];
    }

    return anomalies.slice(0, 3).map((expense) => ({
      type: 'anomaly' as const,
      title: 'Potential unusual expense',
      message: `${expense.description} at ${expense.amount.toFixed(2)} stands out compared with your typical transaction size.`
    }));
  }

  async forecast(input: AnalyticsProviderInput) {
    const period = input.period ?? 'monthly';
    const averageExpense = average(input.expenses.map((expense) => expense.amount));
    const multiplier = period === 'weekly' ? 7 : period === 'quarterly' ? 90 : 30;

    return {
      userId: input.userId,
      period,
      predictedAmount: Number((averageExpense * (multiplier / 3)).toFixed(2)),
      confidence: input.expenses.length >= 10 ? 0.74 : 0.42
    };
  }

  async generateInsight(type: InsightType, title: string, message: string) {
    return {
      type,
      title,
      message
    };
  }
}
