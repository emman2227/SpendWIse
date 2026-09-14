'use client';

import {
  BellRing,
  Bot,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  PieChart,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/lib/notifications/client';
import {
  defaultNotificationPreferences,
  type NotificationPreferenceKey,
  notificationPreferenceOptions,
} from '@/lib/notifications/preferences';
import { cn } from '@/lib/utils';

const channelIconMap: Record<NotificationPreferenceKey, typeof BellRing> = {
  budget: PieChart,
  ai: Bot,
  forecast: TrendingUp,
  recurring: CalendarClock,
  goal: Target,
  transaction: CreditCard,
};

export function NotificationsSettingsPanel() {
  const { data } = useNotificationPreferences();
  const preferences = data || defaultNotificationPreferences;
  const updatePreferences = useUpdateNotificationPreferences();
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 3000);
  };

  const setPreference = (key: NotificationPreferenceKey, enabled: boolean) => {
    updatePreferences.mutate(
      { [key]: enabled },
      {
        onSuccess: () => {
          const item = notificationPreferenceOptions.find((o) => o.key === key);
          showFeedback(`${enabled ? 'Enabled' : 'Muted'} ${item?.label ?? key} alerts.`);
        },
      },
    );
  };

  const setAllPreferences = (enabled: boolean) => {
    const allUpdates = Object.fromEntries(
      notificationPreferenceOptions.map((option) => [option.key, enabled]),
    );
    updatePreferences.mutate(allUpdates, {
      onSuccess: () => {
        showFeedback(
          enabled
            ? 'All notification channels have been enabled.'
            : 'All notification channels are now paused.',
        );
      },
    });
  };

  const resetPreferences = () => {
    updatePreferences.mutate(defaultNotificationPreferences, {
      onSuccess: () => {
        showFeedback('Notification preferences reset to system defaults.');
      },
    });
  };

  const activeChannelCount = notificationPreferenceOptions.filter(
    (option) => preferences[option.key],
  ).length;
  const allChannelsEnabled = activeChannelCount === notificationPreferenceOptions.length;
  const allChannelsPaused = activeChannelCount === 0;

  return (
    <SurfaceCard className="overflow-hidden rounded-[32px] p-0 shadow-soft">
      {/* Header section with active count summary */}
      <div className="border-b border-line/80 p-6 sm:p-8 md:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-brand/10 text-brand sm:h-16 sm:w-16 sm:rounded-[24px]">
                <BellRing className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="kicker">Alerts & Digests</p>
                  <Badge variant="success" className="text-[10px] py-0.5 px-2.5">
                    Live Engine
                  </Badge>
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  Notification Channels
                </h2>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft sm:text-sm sm:leading-6">
              Control the realtime alerts dispatched to your workspace header bell and email
              digests. Customized per alert category.
            </p>
          </div>

          {/* Active stats counter pill */}
          <div className="flex items-center gap-4 rounded-[24px] border border-line bg-paper p-4.5 shadow-xs">
            <div>
              <p className="text-xs font-semibold text-ink-soft">Active Channels</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-ink sm:text-3xl">
                  {activeChannelCount}
                </span>
                <span className="text-xs font-semibold text-ink-soft">
                  / {notificationPreferenceOptions.length}
                </span>
              </div>
            </div>
            <div className="h-9 w-px bg-line" />
            <div>
              <Badge
                variant={allChannelsPaused ? 'danger' : 'success'}
                className="text-xs py-1 px-2.5"
              >
                {allChannelsPaused ? 'All Paused' : allChannelsEnabled ? 'All Active' : 'Custom'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Batch action buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            disabled={allChannelsEnabled || updatePreferences.isPending}
            onClick={() => setAllPreferences(true)}
            variant="secondary"
            className="h-10 rounded-full px-6 text-xs sm:text-sm font-semibold shadow-xs"
          >
            Enable all
          </Button>
          <Button
            disabled={allChannelsPaused || updatePreferences.isPending}
            onClick={() => setAllPreferences(false)}
            variant="soft"
            className="h-10 rounded-full px-6 text-xs sm:text-sm font-semibold shadow-xs"
          >
            Pause all
          </Button>
          <Button
            disabled={updatePreferences.isPending}
            onClick={resetPreferences}
            variant="outline"
            className="h-10 rounded-full px-6 text-xs sm:text-sm font-semibold shadow-xs"
          >
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5 mr-2 shrink-0',
                updatePreferences.isPending && 'animate-spin',
              )}
            />
            <span>Reset defaults</span>
          </Button>
        </div>

        {feedback && (
          <div className="mt-5 flex items-center gap-2 rounded-[20px] border border-brand/20 bg-brand/10 p-4 text-xs font-semibold text-brand-strong sm:text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Grid of Toggleable Notification Channels */}
      <div className="grid gap-4.5 p-6 sm:p-8 md:grid-cols-2">
        {notificationPreferenceOptions.map((option) => {
          const enabled = preferences[option.key];
          const Icon = channelIconMap[option.key] ?? BellRing;

          return (
            <button
              aria-pressed={enabled}
              className={cn(
                'group flex min-h-[120px] items-start justify-between gap-4 rounded-[24px] border p-5 text-left transition-all duration-200',
                enabled
                  ? 'border-brand/30 bg-brand/5 shadow-xs'
                  : 'border-line bg-paper hover:border-brand/30 hover:bg-paper-strong',
              )}
              key={option.key}
              onClick={() => setPreference(option.key, !enabled)}
              type="button"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors',
                    enabled
                      ? 'bg-brand text-white'
                      : 'bg-paper-strong text-ink-soft border border-line',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-ink group-hover:text-brand transition-colors">
                    {option.label}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft">
                    {option.description}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <span
                className={cn(
                  'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
                  enabled ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-700',
                )}
              >
                <span
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow-xs transition-transform',
                    enabled ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
