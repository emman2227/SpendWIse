import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ budgetId: string }> },
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

    const { budgetId } = await context.params;
    const budget = await fetchBackend(`/budgets/${budgetId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: budget }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
