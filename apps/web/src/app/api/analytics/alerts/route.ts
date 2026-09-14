import type { Alert } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const refresh = searchParams.get('refresh');

    const queryParams = new URLSearchParams();
    if (status) queryParams.set('status', status);
    if (refresh) queryParams.set('refresh', refresh);

    const endpoint = `/analytics/alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const alerts = await fetchBackend<Alert[]>(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: alerts }), session);
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const endpoint = status
      ? `/analytics/alerts/generate?status=${encodeURIComponent(status)}`
      : '/analytics/alerts/generate';

    const alerts = await fetchBackend<Alert[]>(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: alerts }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
