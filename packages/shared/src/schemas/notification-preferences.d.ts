import type { z } from 'zod';
export declare const NOTIFICATION_PREFERENCE_KEYS: readonly [
  'budget',
  'ai',
  'forecast',
  'recurring',
  'goal',
  'transaction',
];
export type NotificationPreferenceKey = (typeof NOTIFICATION_PREFERENCE_KEYS)[number];
export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;
export declare const defaultNotificationPreferences: NotificationPreferences;
export declare const updateNotificationPreferencesSchema: z.ZodObject<
  {
    budget: z.ZodOptional<z.ZodBoolean>;
    ai: z.ZodOptional<z.ZodBoolean>;
    forecast: z.ZodOptional<z.ZodBoolean>;
    recurring: z.ZodOptional<z.ZodBoolean>;
    goal: z.ZodOptional<z.ZodBoolean>;
    transaction: z.ZodOptional<z.ZodBoolean>;
  },
  'strip',
  z.ZodTypeAny,
  {
    forecast?: boolean | undefined;
    budget?: boolean | undefined;
    ai?: boolean | undefined;
    recurring?: boolean | undefined;
    goal?: boolean | undefined;
    transaction?: boolean | undefined;
  },
  {
    forecast?: boolean | undefined;
    budget?: boolean | undefined;
    ai?: boolean | undefined;
    recurring?: boolean | undefined;
    goal?: boolean | undefined;
    transaction?: boolean | undefined;
  }
>;
//# sourceMappingURL=notification-preferences.d.ts.map
