import { type NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/constants';
import {
  clearSessionCookies,
  createErrorResponse,
  revokeServerSession,
} from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ data: { success: true } });

  try {
    await revokeServerSession({
      accessToken: request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
      refreshToken: request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
    });
  } catch (error) {
    return createErrorResponse(error);
  }

  clearSessionCookies(response);

  return response;
}
