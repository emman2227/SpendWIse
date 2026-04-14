'use client';

import type { Expense, Forecast, Insight } from '@spendwise/shared';

export interface DashboardBudgetSummaryItem {
  id: string;
  userId: string;
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAnalyticsData {
  totals: {
    totalExpenses: number;
    transactionCount: number;
  };
  budgetSummary: {
    month: number;
    year: number;
    items: DashboardBudgetSummaryItem[];
  };
  recentTransactions: Expense[];
  categoryBreakdown: Array<{
    categoryId: string;
    amount: number;
  }>;
  insights: Insight[];
  forecast: Forecast | null;
}

export interface AnalyticsGenerationResult {
  insights: Insight[];
  forecast: Forecast;
}

export class AnalyticsClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

const parseJsonSafely = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return undefined;
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

const request = async <T>(path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers,
  });
  const body = await parseJsonSafely(response);

  if (!response.ok) {
    throw new AnalyticsClientError(
      typeof body?.message === 'string' ? body.message : 'The request could not be completed.',
      response.status,
      body?.details,
    );
  }

  if (body && 'data' in body) {
    return body.data as T;
  }

  return body as T;
};

export const dashboardAnalyticsQueryKey = ['analytics', 'dashboard'] as const;

export const getDashboardAnalytics = () =>
  request<DashboardAnalyticsData>('/api/analytics/dashboard');

export const generateAnalytics = () =>
  request<AnalyticsGenerationResult>('/api/analytics/generate', {
    method: 'POST',
  });
