import { formatCurrency } from '@spendwise/shared';

export const formatMoney = (amount: number, currency = 'USD') =>
  formatCurrency(amount, 'en-US', currency);

export const formatDelta = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;

export const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

export const formatConfidence = (value: number) => `${Math.round(value * 100)}% confidence`;
