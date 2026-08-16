import { type Budget } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

export async function POST(
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

    const bodyText = await request.text();
    let body = { email: '' };
    try {
      body = JSON.parse(bodyText);
    } catch {
      // Ignore
    }

    if (!body.email) {
      return NextResponse.json(
        { message: 'Validation failed. Email is required.' },
        { status: 400 },
      );
    }

    const budget = await fetchBackend<Budget>(`/budgets/${budgetId}/share`, {
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
