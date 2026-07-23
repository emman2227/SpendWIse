import { z } from 'zod';

export const NOTIFICATION_PREFERENCE_KEYS = [
  'budget',
  'ai',
  'forecast',
  'recurring',
  'goal',
  'transaction',
] as const;

export type NotificationPreferenceKey = (typeof NOTIFICATION_PREFERENCE_KEYS)[number];

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const defaultNotificationPreferences: NotificationPreferences = {
  budget: true,
  ai: true,
  forecast: true,
  recurring: true,
  goal: true,
  transaction: true,
};

export const updateNotificationPreferencesSchema = z.object({
  budget: z.boolean().optional(),
  ai: z.boolean().optional(),
  forecast: z.boolean().optional(),
  recurring: z.boolean().optional(),
  goal: z.boolean().optional(),
  transaction: z.boolean().optional(),
});
