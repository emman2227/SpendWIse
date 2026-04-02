export const APP_NAME = 'SpendWise';
export const API_PREFIX = '/api';
export const API_VERSION = '1';

export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Utilities',
  'Housing',
  'Health',
  'Education',
  'Entertainment',
  'Shopping',
  'Savings',
  'Other'
] as const;

export const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'e_wallet'] as const;
export const INSIGHT_TYPES = ['summary', 'anomaly', 'trend', 'recommendation'] as const;
export const FORECAST_PERIODS = ['weekly', 'monthly', 'quarterly'] as const;
