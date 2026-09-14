'use client';

import { request } from '../auth/client';

export interface ExportedUserData {
  exportMetadata: {
    exportedAt: string;
    version: string;
    appName: string;
    userId: string;
  };
  profile: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    currency: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  notificationPreferences: Record<string, boolean>;
  expenses: Array<{
    id: string;
    amount: number;
    categoryId: string;
    description: string;
    paymentMethod: string;
    date: string;
    notes?: string;
    createdAt: string;
  }>;
  budgets: Array<{
    id: string;
    categoryId: string;
    limitAmount: number;
    month: number;
    year: number;
    createdAt: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    notes?: string;
    createdAt: string;
  }>;
  customCategories: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    createdAt: string;
  }>;
}

export const exportUserData = () =>
  request<ExportedUserData>('/api/users/me/export', {
    method: 'GET',
  });

export const clearUserData = (password: string) =>
  request<{ success: boolean; message: string; deletedCount: number }>('/api/users/me/clear-data', {
    method: 'POST',
    body: JSON.stringify({ password, confirmation: 'CLEAR' }),
  });

export const deleteAccount = (password: string) =>
  request<{ success: boolean; message: string }>('/api/users/me/delete', {
    method: 'POST',
    body: JSON.stringify({ password, confirmation: 'DELETE' }),
  });
