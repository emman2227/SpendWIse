import { type NextRequest, NextResponse } from 'next/server';

import { type ForecastDetailsData } from '@/lib/analytics/client';
import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

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

    const forecast = await fetchBackend<ForecastDetailsData>('/analytics/forecast', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: forecast }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
