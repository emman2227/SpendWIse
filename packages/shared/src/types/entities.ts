import type {
  FORECAST_PERIODS,
  FORECAST_RISK_LEVELS,
  INSIGHT_SEVERITIES,
  INSIGHT_TYPES,
  PAYMENT_METHODS,
} from '../constants/app';

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type InsightType = (typeof INSIGHT_TYPES)[number];
export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number];
export type ForecastPeriod = (typeof FORECAST_PERIODS)[number];
export type ForecastRiskLevel = (typeof FORECAST_RISK_LEVELS)[number];

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  currency: string;
  emailVerified: boolean;
  passwordHash: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currency: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId?: string;
  isSystemDefined: boolean;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense extends BaseEntity {
  userId: string;
  amount: number;
  categoryId: string;
  description: string;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
}

export interface Budget extends BaseEntity {
  userId: string;
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
}

export interface Goal extends BaseEntity {
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  notes?: string;
}

export interface InsightEvidence {
  currentSpend?: number;
  averageSpend?: number;
  percentChange?: number;
  budget?: number;
  budgetUtilization?: number;
  transactionCount?: number;
  unusualTransactionCount?: number;
  comparisonPeriod?: string;
  [key: string]: unknown;
}

export interface Insight extends BaseEntity {
  userId: string;
  type: InsightType;
  severity: InsightSeverity;
  category?: string;
  title: string;
  message: string;
  reason?: string;
  evidence?: InsightEvidence;
  impact?: string;
  recommendation?: string;
}

export interface CategoryForecast {
  category: string;
  currentAmount: number;
  predictedAmount: number;
  budget?: number;
  variance: number;
  riskLevel: ForecastRiskLevel;
}

export interface ForecastRisk {
  category: string;
  projectedAmount: number;
  budgetAmount: number;
  riskLevel: ForecastRiskLevel;
  explanation: string;
}

export interface Forecast {
  id: string;
  userId: string;
  period: ForecastPeriod;
  currentSpend: number;
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  confidenceExplanation?: string;
  categoryForecasts: CategoryForecast[];
  risks: ForecastRisk[];
  assumptions: string[];
  generatedAt: string;
}
