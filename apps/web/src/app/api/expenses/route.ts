import { createExpenseSchema, type Expense, expenseQuerySchema } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  parseRequestBody,
  resolveAccessToken,
} from '@/lib/auth/server';

const buildExpenseSearchParams = (query: {
  categoryId?: string;
  month?: number;
  year?: number;
}) => {
  const params = new URLSearchParams();

  if (query.categoryId) {
    params.set('categoryId', query.categoryId);
  }

  if (query.month) {
    params.set('month', String(query.month));
  }

  if (query.year) {
    params.set('year', String(query.year));
  }

  const search = params.toString();

  return search ? `?${search}` : '';
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

    const queryResult = expenseQuerySchema.safeParse({
      categoryId: request.nextUrl.searchParams.get('categoryId') ?? undefined,
      month: request.nextUrl.searchParams.get('month') ?? undefined,
      year: request.nextUrl.searchParams.get('year') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          message: 'Validation failed.',
          details: queryResult.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const expenses = await fetchBackend<Expense[]>(
      `/expenses${buildExpenseSearchParams(queryResult.data)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return applySessionToResponse(NextResponse.json({ data: expenses }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      return createAuthenticationRequiredResponse();
    }

    const accessToken = resolveAccessToken(request, session);

    if (!accessToken) {
      return createAuthenticationRequiredResponse();
    }

    const body = await parseRequestBody(request, createExpenseSchema);
    const expense = await fetchBackend<Expense>('/expenses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    return applySessionToResponse(NextResponse.json({ data: expense }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
