import { type Expense, type Forecast, type Insight } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

interface DashboardBudgetSummaryItem {
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

interface DashboardAnalyticsData {
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

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      return createAuthenticationRequiredResponse();
    }

    const accessToken = resolveAccessToken(request, session);

    if (!accessToken) {
      return createAuthenticationRequiredResponse();
    }

    const dashboard = await fetchBackend<DashboardAnalyticsData>('/analytics/dashboard', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: dashboard }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
