import { type AuthSession, verifyEmailSchema } from '@spendwise/shared';
import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  fetchBackend,
  parseRequestBody,
  setSessionCookies,
} from '@/lib/auth/server';

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request, verifyEmailSchema);
    const session = await fetchBackend<AuthSession>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const response = NextResponse.json({ data: session.user });

    setSessionCookies(response, session.tokens);

    return response;
  } catch (error) {
    return createErrorResponse(error);
  }
}
