import {
  type NotificationPreferences,
  updateNotificationPreferencesSchema,
} from '@spendwise/shared';
import { type NextRequest, NextResponse } from 'next/server';

import {
  applySessionToResponse,
  createAuthenticationRequiredResponse,
  createErrorResponse,
  fetchBackend,
  getCurrentUserFromRequest,
  parseRequestBody,
  resolveAccessToken,
} from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      return createAuthenticationRequiredResponse();
    }

    const accessToken = resolveAccessToken(request, session);

    if (!accessToken) {
      return createAuthenticationRequiredResponse();
    }

    const preferences = await fetchBackend<NotificationPreferences>(
      '/users/me/notification-preferences',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return applySessionToResponse(NextResponse.json({ data: preferences }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUserFromRequest(request);

    if (!session) {
      return createAuthenticationRequiredResponse();
    }

    const accessToken = resolveAccessToken(request, session);

    if (!accessToken) {
      return createAuthenticationRequiredResponse();
    }

    const body = await parseRequestBody(request, updateNotificationPreferencesSchema);
    const updatedPreferences = await fetchBackend<NotificationPreferences>(
      '/users/me/notification-preferences',
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    return applySessionToResponse(NextResponse.json({ data: updatedPreferences }), session);
  } catch (error) {
    return createErrorResponse(error, { exposeMessage: true });
  }
}
