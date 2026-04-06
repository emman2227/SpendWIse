import { requestPasswordResetSchema, type VerificationDispatchResult } from '@spendwise/shared';
import { NextResponse } from 'next/server';

import { createErrorResponse, fetchBackend, parseRequestBody } from '@/lib/auth/server';

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request, requestPasswordResetSchema);
    const result = await fetchBackend<VerificationDispatchResult>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return createErrorResponse(error);
  }
}
