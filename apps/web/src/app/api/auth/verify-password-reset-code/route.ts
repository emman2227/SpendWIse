import { type CodeVerificationResult, verifyPasswordResetCodeSchema } from '@spendwise/shared';
import { NextResponse } from 'next/server';

import { createErrorResponse, fetchBackend, parseRequestBody } from '@/lib/auth/server';

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request, verifyPasswordResetCodeSchema);
    const result = await fetchBackend<CodeVerificationResult>('/auth/verify-password-reset-code', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return createErrorResponse(error);
  }
}
