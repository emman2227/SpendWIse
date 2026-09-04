'use client';

import type {
  CreateRecurringExpenseInput,
  RecurringExpense,
  UpdateRecurringExpenseInput,
} from '@spendwise/shared';

export class RecurringClientError extends Error {
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
    throw new RecurringClientError(
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

export const savedRecurringQueryKey = ['recurring', 'saved'] as const;

export const listSavedRecurring = () => request<RecurringExpense[]>('/api/recurring');

export const createRecurringExpense = (payload: CreateRecurringExpenseInput) =>
  request<RecurringExpense>('/api/recurring', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateRecurringExpense = (id: string, payload: UpdateRecurringExpenseInput) =>
  request<RecurringExpense>(`/api/recurring/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteRecurringExpense = (id: string) =>
  request<RecurringExpense>(`/api/recurring/${id}`, {
    method: 'DELETE',
  });
