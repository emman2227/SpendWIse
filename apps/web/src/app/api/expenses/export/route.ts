import { type NextRequest, NextResponse } from 'next/server';

import {
  createAuthenticationRequiredResponse,
  createErrorResponse,
  getCurrentUserFromRequest,
  resolveAccessToken,
} from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);
    if (!session) return createAuthenticationRequiredResponse();

    const accessToken = resolveAccessToken(request, session);
    if (!accessToken) return createAuthenticationRequiredResponse();

    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    const response = await fetch(`${backendBaseUrl}/expenses/export`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const csvData = await response.text();

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="all-transactions.csv"',
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
