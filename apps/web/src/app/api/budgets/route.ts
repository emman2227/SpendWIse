import { type Budget,createBudgetSchema } from '@spendwise/shared';
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

    const budgets = await fetchBackend<Budget[]>(
      `/budgets?month=${query.month}&year=${query.year}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return applySessionToResponse(NextResponse.json({ data: budgets }), session);
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

    const body = await parseRequestBody(request, createBudgetSchema);
    const budget = await fetchBackend<Budget>('/budgets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    return applySessionToResponse(NextResponse.json({ data: budget }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
