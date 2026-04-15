export type NotificationPreferenceKey =
  | 'budget'
  | 'ai'
  | 'forecast'
  | 'recurring'
  | 'goal'
  | 'transaction';

export type NotificationCategory =
  | 'Budget'
  | 'AI Insight'
  | 'Forecast'
  | 'Recurring'
  | 'Goal'
  | 'Transaction';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export interface NotificationPreferenceOption {
  key: NotificationPreferenceKey;
  label: string;
  description: string;
}

export const notificationReadStorageKey = 'spendwise-notification-read-ids';
export const notificationPreferencesStorageKey = 'spendwise-notification-preferences';
export const notificationPreferencesChangedEvent = 'spendwise-notification-preferences-changed';

export const defaultNotificationPreferences: NotificationPreferences = {
  budget: true,
  ai: true,
  forecast: true,
  recurring: true,
  goal: true,
  transaction: true,
};

export const notificationCategoryPreferenceKey: Record<
  NotificationCategory,
  NotificationPreferenceKey
> = {
  Budget: 'budget',
  'AI Insight': 'ai',
  Forecast: 'forecast',
  Recurring: 'recurring',
  Goal: 'goal',
  Transaction: 'transaction',
};

export const notificationPreferenceOptions: NotificationPreferenceOption[] = [
  {
    key: 'budget',
    label: 'Budget warnings',
    description: 'Over-budget and near-limit reminders.',
  },
  {
    key: 'ai',
    label: 'AI insights',
    description: 'Smart observations and unusual spending signals.',
  },
  {
    key: 'forecast',
    label: 'Forecast updates',
    description: 'Month-end spending projection changes.',
  },
  {
    key: 'recurring',
    label: 'Recurring reminders',
    description: 'Subscriptions, bills, and repeated charges.',
  },
  {
    key: 'goal',
    label: 'Goal reminders',
    description: 'Savings milestones and deadline risks.',
  },
  {
    key: 'transaction',
    label: 'Transaction nudges',
    description: 'Large expenses that may need review.',
  },
];

export const parseNotificationReadIds = (value: string | null) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
};

export const parseNotificationPreferences = (value: string | null): NotificationPreferences => {
  if (!value) {
    return defaultNotificationPreferences;
  }

  try {
    const parsed = JSON.parse(value) as Partial<Record<NotificationPreferenceKey, unknown>>;

    return Object.fromEntries(
      Object.entries(defaultNotificationPreferences).map(([key, defaultValue]) => {
        const typedKey = key as NotificationPreferenceKey;
        const parsedValue = parsed[typedKey];

        return [typedKey, typeof parsedValue === 'boolean' ? parsedValue : defaultValue];
      }),
    ) as NotificationPreferences;
  } catch {
    return defaultNotificationPreferences;
  }
};
