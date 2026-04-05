'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { authQueryKey, logoutSession, useCurrentUserQuery } from '@/lib/auth/client';
import {
  buildActivityCookieString,
  HOME_ROUTE,
  INACTIVITY_TIMEOUT_MS,
  isGuestOnlyRoute,
  isProtectedRoute,
  LOGOUT_INTENT_STORAGE_KEY,
} from '@/lib/auth/constants';

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['focus', 'keydown', 'pointerdown', 'touchstart'];
const ACTIVITY_WRITE_THROTTLE_MS = 15_000;

export const AuthSessionManager = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: user, isFetched, isLoading } = useCurrentUserQuery();
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityWriteRef = useRef(0);
  const logoutReasonRef = useRef<'inactive' | 'expired' | null>(null);

  useEffect(() => {
    if (!user) {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }

      return;
    }

    const scheduleLogout = () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }

      logoutTimerRef.current = setTimeout(() => {
        logoutReasonRef.current = 'inactive';
        void logoutSession()
          .catch(() => undefined)
          .finally(() => {
            void queryClient.setQueryData(authQueryKey, null);
            router.replace('/login?reason=inactive');
          });
      }, INACTIVITY_TIMEOUT_MS);
    };

    const markActivity = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      const now = Date.now();

      if (now - lastActivityWriteRef.current >= ACTIVITY_WRITE_THROTTLE_MS) {
        document.cookie = buildActivityCookieString(now);
        lastActivityWriteRef.current = now;
      }

      scheduleLogout();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markActivity();
      }
    };

    markActivity();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(
        eventName,
        markActivity,
        eventName === 'pointerdown' || eventName === 'touchstart' ? { passive: true } : undefined,
      );
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, router, user]);

  useEffect(() => {
    if (isLoading || !isFetched) {
      return;
    }

    const manualLogoutIntent =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(LOGOUT_INTENT_STORAGE_KEY) === 'manual';

    if (manualLogoutIntent && !isProtectedRoute(pathname)) {
      window.sessionStorage.removeItem(LOGOUT_INTENT_STORAGE_KEY);
    }

    if (manualLogoutIntent && user) {
      window.sessionStorage.removeItem(LOGOUT_INTENT_STORAGE_KEY);
    }

    if (user && isGuestOnlyRoute(pathname)) {
      router.replace(HOME_ROUTE);
      return;
    }

    if (!user && isProtectedRoute(pathname) && !logoutReasonRef.current) {
      if (manualLogoutIntent) {
        return;
      }

      logoutReasonRef.current = 'expired';
      void logoutSession()
        .catch(() => undefined)
        .finally(() => {
          void queryClient.setQueryData(authQueryKey, null);
          router.replace('/login?reason=expired');
        });
      return;
    }

    if (user) {
      logoutReasonRef.current = null;
    }
  }, [isFetched, isLoading, pathname, queryClient, router, user]);

  return <>{children}</>;
};
