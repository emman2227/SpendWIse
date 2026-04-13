import { type Expense, updateExpenseSchema } from '@spendwise/shared';
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ expenseId: string }> },
) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      return createAuthenticationRequiredResponse();
    }

    const accessToken = resolveAccessToken(request, session);

    if (!accessToken) {
      return createAuthenticationRequiredResponse();
    }

    const { expenseId } = await context.params;
    const body = await parseRequestBody(request, updateExpenseSchema);
    const expense = await fetchBackend<Expense>(`/expenses/${expenseId}`, {
      method: 'PATCH',
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ expenseId: string }> },
) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      return createAuthenticationRequiredResponse();
    }

    const accessToken = resolveAccessToken(request, session);

    if (!accessToken) {
      return createAuthenticationRequiredResponse();
    }

    const { expenseId } = await context.params;
    const expense = await fetchBackend<Expense>(`/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: expense }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
