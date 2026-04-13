'use client';

import type { Category } from '@spendwise/shared';

export interface CategoryPayload {
  name: string;
  icon: string;
  color: string;
}

export type CategoryUpdatePayload = Partial<CategoryPayload>;

export class CategoriesClientError extends Error {
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
    throw new CategoriesClientError(
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

export const categoriesQueryKey = ['categories', 'list'] as const;

export const listCategories = () => request<Category[]>('/api/categories');

export const createCategory = (payload: CategoryPayload) =>
  request<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateCategory = (categoryId: string, payload: CategoryUpdatePayload) =>
  request<Category>(`/api/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteCategory = (categoryId: string) =>
  request<Category>(`/api/categories/${categoryId}`, {
    method: 'DELETE',
  });
