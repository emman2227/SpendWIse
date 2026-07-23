import { updateProfileSchema,type UserProfile } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  clearSessionCookies,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  parseRequestBody,
  resolveAccessToken,
  setSessionCookies,
  touchActivityCookie,
} from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      const response = NextResponse.json(
        {
          message: 'Authentication required.',
        },
        {
          status: 401,
        },
      );

      clearSessionCookies(response);

      return response;
    }

    const response = NextResponse.json({ data: session.user });

    if (session.tokens) {
      setSessionCookies(response, session.tokens);
    } else {
      touchActivityCookie(response);
    }

    return response;
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      return createAuthenticationRequiredResponse();
    }

    const accessToken = resolveAccessToken(request, session);

    if (!accessToken) {
      return createAuthenticationRequiredResponse();
    }

    const body = await parseRequestBody(request, updateProfileSchema);
    const updatedProfile = await fetchBackend<UserProfile>('/users/me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    return applySessionToResponse(NextResponse.json({ data: updatedProfile }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
