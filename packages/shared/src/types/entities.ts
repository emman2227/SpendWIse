import { FORECAST_PERIODS, INSIGHT_TYPES, PAYMENT_METHODS } from '../constants/app';

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type InsightType = (typeof INSIGHT_TYPES)[number];
export type ForecastPeriod = (typeof FORECAST_PERIODS)[number];

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
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

export interface Insight extends BaseEntity {
  userId: string;
  type: InsightType;
  title: string;
  message: string;
}

export interface Forecast {
  id: string;
  userId: string;
  period: ForecastPeriod;
  predictedAmount: number;
  confidence: number;
  generatedAt: string;
}
