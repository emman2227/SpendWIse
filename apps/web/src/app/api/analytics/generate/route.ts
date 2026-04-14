import { type Forecast, type Insight } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

interface AnalyticsGenerationResult {
  insights: Insight[];
  forecast: Forecast;
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

    const result = await fetchBackend<AnalyticsGenerationResult>('/analytics/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: result }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
