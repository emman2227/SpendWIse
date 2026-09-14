import { deleteAccountSchema } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import {
  clearSessionCookies,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  parseRequestBody,
  resolveAccessToken,
} from '@/lib/auth/server';

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

    const body = await parseRequestBody(request, deleteAccountSchema);
    const result = await fetchBackend<{ success: boolean; message: string }>('/users/me/delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const response = NextResponse.json({ data: result });
    clearSessionCookies(response);
    return response;
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
