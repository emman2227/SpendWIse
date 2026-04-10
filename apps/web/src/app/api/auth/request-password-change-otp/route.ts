import { requestPasswordChangeOtpSchema, type VerificationDispatchResult } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import {
  clearSessionCookies,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  parseRequestBody,
  setSessionCookies,
  touchActivityCookie,
} from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, requestPasswordChangeOtpSchema);
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

    const accessToken =
      session.tokens?.accessToken ?? request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
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

    const result = await fetchBackend<VerificationDispatchResult>(
      '/auth/request-password-change-otp',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    const response = NextResponse.json({ data: result });

    if (session.tokens) {
      setSessionCookies(response, session.tokens);
    } else {
      touchActivityCookie(response);
    }

    return response;
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
