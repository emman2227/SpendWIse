import { type NextRequest, NextResponse } from 'next/server';

import {
  clearSessionCookies,
  createErrorResponse,
  getCurrentUserFromRequest,
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
