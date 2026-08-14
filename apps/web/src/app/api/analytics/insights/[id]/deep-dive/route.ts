import { type NextRequest, NextResponse } from 'next/server';

import { type DeepDiveResult } from '@/lib/analytics/client';
import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      return createAuthenticationRequiredResponse();
    }

    const accessToken = resolveAccessToken(request, session);

    if (!accessToken) {
      return createAuthenticationRequiredResponse();
    }

    const resolvedParams = await params;
    const body = await request.json();

    const result = await fetchBackend<DeepDiveResult>(
      `/analytics/insights/${resolvedParams.id}/deep-dive`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    return applySessionToResponse(NextResponse.json({ data: result }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
