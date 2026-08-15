import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);
    if (!session) return createAuthenticationRequiredResponse();

    const accessToken = resolveAccessToken(request, session);
    if (!accessToken) return createAuthenticationRequiredResponse();

    const body = await fetchBackend('/analytics/budgets/recommend', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: body }), session);
  } catch (error) {
    return createErrorResponse(error);
  }
}
