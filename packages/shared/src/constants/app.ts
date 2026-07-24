export const APP_NAME = 'SpendWise';
export const API_PREFIX = '/api';
export const API_VERSION = '1';

export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Utilities',
  'Housing',
  'Health',
  'Personal Care',
  'Education',
  'Entertainment',
  'Shopping',
  'Savings',
  'Other',
] as const;

export const PAYMENT_METHODS = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'e_wallet',
] as const;
export const INSIGHT_TYPES = ['summary', 'anomaly', 'trend', 'recommendation'] as const;
export const FORECAST_PERIODS = ['weekly', 'monthly', 'quarterly'] as const;

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
] as const;
