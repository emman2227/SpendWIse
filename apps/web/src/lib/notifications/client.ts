import type { NotificationPreferences } from '@spendwise/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { request } from '../auth/client';
import { defaultNotificationPreferences } from './preferences';

export const notificationPreferencesQueryKey = ['users', 'me', 'notification-preferences'] as const;

export const getNotificationPreferences = () =>
  request<NotificationPreferences>('/api/users/me/notification-preferences', {
    method: 'GET',
  });

export const updateNotificationPreferences = (input: Partial<NotificationPreferences>) =>
  request<NotificationPreferences>('/api/users/me/notification-preferences', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationPreferencesQueryKey,
    queryFn: getNotificationPreferences,
    staleTime: Infinity,
    placeholderData: defaultNotificationPreferences,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (newPreferences) => {
      await queryClient.cancelQueries({ queryKey: notificationPreferencesQueryKey });
      const previous = queryClient.getQueryData<NotificationPreferences>(
        notificationPreferencesQueryKey,
      );

      queryClient.setQueryData<NotificationPreferences>(
        notificationPreferencesQueryKey,
        (old = defaultNotificationPreferences) => ({
          ...old,
          ...newPreferences,
        }),
      );

      return { previous };
    },
    onError: (err, newPreferences, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationPreferencesQueryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationPreferencesQueryKey });
    },
  });
};
