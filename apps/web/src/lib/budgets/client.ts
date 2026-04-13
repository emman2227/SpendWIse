'use client';

import type { Budget } from '@spendwise/shared';

export interface BudgetPayload {
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
}

export interface BudgetSummaryItem extends Budget {
  spent: number;
  remaining: number;
  isOverBudget: boolean;
}

export interface BudgetSummary {
  month: number;
  year: number;
  items: BudgetSummaryItem[];
}

export class BudgetsClientError extends Error {
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
    throw new BudgetsClientError(
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

const toSearch = (month: number, year: number) => `month=${month}&year=${year}`;

export const budgetsQueryKey = (month: number, year: number) =>
  ['budgets', 'list', month, year] as const;

export const budgetSummaryQueryKey = (month: number, year: number) =>
  ['budgets', 'summary', month, year] as const;

export const listBudgets = (month: number, year: number) =>
  request<Budget[]>(`/api/budgets?${toSearch(month, year)}`);

export const getBudgetSummary = (month: number, year: number) =>
  request<BudgetSummary>(`/api/budgets/summary?${toSearch(month, year)}`);

export const upsertBudget = (payload: BudgetPayload) =>
  request<Budget>('/api/budgets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const deleteBudget = (budgetId: string) =>
  request<Budget>(`/api/budgets/${budgetId}`, {
    method: 'DELETE',
  });
