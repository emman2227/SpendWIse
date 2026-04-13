import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

interface BudgetSummaryItem {
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

interface BudgetSummary {
  month: number;
  year: number;
  items: BudgetSummaryItem[];
}

const parseBudgetQuery = (request: NextRequest) => {
  const month = Number(request.nextUrl.searchParams.get('month') ?? '');
  const year = Number(request.nextUrl.searchParams.get('year') ?? '');

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return null;
  }

  return { month, year };
};

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

    const query = parseBudgetQuery(request);

    if (!query) {
      return NextResponse.json(
        {
          message: 'Validation failed.',
        },
        {
          status: 400,
        },
      );
    }

    const summary = await fetchBackend<BudgetSummary>(
      `/budgets/summary?month=${query.month}&year=${query.year}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return applySessionToResponse(NextResponse.json({ data: summary }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
