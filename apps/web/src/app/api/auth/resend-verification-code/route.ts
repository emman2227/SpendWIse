import { resendVerificationCodeSchema, type VerificationDispatchResult } from '@spendwise/shared';
import { NextResponse } from 'next/server';

import { createErrorResponse, fetchBackend, parseRequestBody } from '@/lib/auth/server';

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request, resendVerificationCodeSchema);
    const result = await fetchBackend<VerificationDispatchResult>(
      '/auth/resend-verification-code',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    return createErrorResponse(error);
  }
}
