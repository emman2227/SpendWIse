import { changePasswordWithOtpSchema, type PasswordChangeResult } from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import {
  clearSessionCookies,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  parseRequestBody,
} from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, changePasswordWithOtpSchema);
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

    const result = await fetchBackend<PasswordChangeResult>('/auth/change-password', {
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
