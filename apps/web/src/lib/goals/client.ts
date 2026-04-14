'use client';

import type { Goal } from '@spendwise/shared';

export interface GoalPayload {
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  notes?: string;
}

export type GoalUpdatePayload = Partial<GoalPayload>;

export class GoalsClientError extends Error {
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
    throw new GoalsClientError(
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

export const goalsQueryKey = ['goals', 'list'] as const;

export const listGoals = () => request<Goal[]>('/api/goals');

export const createGoal = (payload: GoalPayload) =>
  request<Goal>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateGoal = (goalId: string, payload: GoalUpdatePayload) =>
  request<Goal>(`/api/goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteGoal = (goalId: string) =>
  request<Goal>(`/api/goals/${goalId}`, {
    method: 'DELETE',
  });
