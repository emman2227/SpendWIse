import { createGoalSchema, type Goal } from '@spendwise/shared';
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

    const goals = await fetchBackend<Goal[]>('/goals', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return applySessionToResponse(NextResponse.json({ data: goals }), session);
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

    const body = await parseRequestBody(request, createGoalSchema);
    const goal = await fetchBackend<Goal>('/goals', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    return applySessionToResponse(NextResponse.json({ data: goal }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
