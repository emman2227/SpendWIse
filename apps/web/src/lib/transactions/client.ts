'use client';

import type { Category, Expense } from '@spendwise/shared';

export interface ExpenseFilters {
  categoryId?: string;
  month?: number;
  year?: number;
}

export interface ExpensePayload {
  amount: number;
  categoryId: string;
  description: string;
  paymentMethod: Expense['paymentMethod'];
  date: string;
  notes?: string;
}

export type ExpenseUpdatePayload = Partial<ExpensePayload>;

export class TransactionsClientError extends Error {
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
    throw new TransactionsClientError(
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

const buildExpenseSearchParams = (filters: ExpenseFilters) => {
  const params = new URLSearchParams();

  if (filters.categoryId) {
    params.set('categoryId', filters.categoryId);
  }

  if (filters.month) {
    params.set('month', String(filters.month));
  }

  if (filters.year) {
    params.set('year', String(filters.year));
  }

  const search = params.toString();

  return search ? `?${search}` : '';
};

export const transactionCategoriesQueryKey = ['transactions', 'categories'] as const;

export const transactionExpensesQueryKey = (filters: ExpenseFilters) =>
  ['transactions', 'expenses', filters.month ?? 'all', filters.year ?? 'all'] as const;

export const listTransactionCategories = () => request<Category[]>('/api/categories');

export const listExpenses = (filters: ExpenseFilters) =>
  request<Expense[]>(`/api/expenses${buildExpenseSearchParams(filters)}`);

export const createExpense = (payload: ExpensePayload) =>
  request<Expense>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateExpense = (expenseId: string, payload: ExpenseUpdatePayload) =>
  request<Expense>(`/api/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteExpense = (expenseId: string) =>
  request<Expense>(`/api/expenses/${expenseId}`, {
    method: 'DELETE',
  });
