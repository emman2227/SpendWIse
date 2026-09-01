import { formatCurrency } from '@spendwise/shared';

export const formatMoney = (amount: number, currency = 'PHP') =>
  formatCurrency(amount, 'en-US', currency);

export const formatDelta = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;

export const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

export const formatConfidence = (value: number) => `${Math.round(value * 100)}% confidence`;

export const formatInsightEvidence = (evidence: unknown, currency = 'PHP'): string | null => {
  if (!evidence) {
    return null;
  }

  if (typeof evidence === 'string') {
    return evidence;
  }

  if (typeof evidence === 'object' && evidence !== null) {
    const data = evidence as Record<string, unknown>;

    const currentSpend = typeof data.currentSpend === 'number' ? data.currentSpend : undefined;
    const averageSpend = typeof data.averageSpend === 'number' ? data.averageSpend : undefined;
    const percentChange = typeof data.percentChange === 'number' ? data.percentChange : undefined;
    const comparisonPeriod =
      typeof data.comparisonPeriod === 'string' ? data.comparisonPeriod : 'recent baseline';
    const budget = typeof data.budget === 'number' ? data.budget : undefined;
    const budgetUtilization =
      typeof data.budgetUtilization === 'number' ? data.budgetUtilization : undefined;

    if (currentSpend !== undefined && averageSpend !== undefined) {
      const deltaText =
        percentChange !== undefined
          ? ` (${percentChange > 0 ? '+' : ''}${Math.round(percentChange)}% change)`
          : '';
      return `Baseline comparison (${comparisonPeriod}): ${formatMoney(currentSpend, currency)} current vs ${formatMoney(averageSpend, currency)} average${deltaText}`;
    }

    if (budget !== undefined && budgetUtilization !== undefined) {
      return `Budget utilization: ${Math.round(budgetUtilization)}% of ${formatMoney(budget, currency)} limit`;
    }

    if (currentSpend !== undefined) {
      return `Current spend logged: ${formatMoney(currentSpend, currency)}`;
    }
  }

  return null;
};
