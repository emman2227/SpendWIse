import type { RegisterResult } from '@spendwise/shared';
import { registerSchema } from '@spendwise/shared';
import { NextResponse } from 'next/server';

import { createErrorResponse, fetchBackend, parseRequestBody } from '@/lib/auth/server';

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request, registerSchema);
    const result = await fetchBackend<RegisterResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    return createErrorResponse(error);
  }
}
