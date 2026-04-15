'use client';

import {
  type Expense,
  formatShortDate,
  getCurrentMonthYear,
  type Insight,
} from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  CheckCheck,
  Clock3,
  PiggyBank,
  ReceiptText,
  Repeat2,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  dashboardAnalyticsQueryKey,
  type DashboardBudgetSummaryItem,
  getDashboardAnalytics,
} from '@/lib/analytics/client';
import { formatMoney } from '@/lib/formatters';
import { goalsQueryKey, listGoals } from '@/lib/goals/client';
import {
  listExpenses,
  listTransactionCategories,
  transactionCategoriesQueryKey,
} from '@/lib/transactions/client';
import { cn } from '@/lib/utils';

type NotificationCategory =
  | 'Budget'
  | 'AI Insight'
  | 'Forecast'
  | 'Recurring'
  | 'Goal'
  | 'Transaction';
type NotificationPriority = 'high' | 'medium' | 'low';

interface WorkspaceNotification {
  id: string;
  title: string;
  detail: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  createdAt: string;
  href: string;
  actionLabel: string;
}

type NotificationPreferenceKey =
  | 'budget'
  | 'ai'
  | 'forecast'
  | 'recurring'
  | 'goal'
  | 'transaction';

type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

const readStorageKey = 'spendwise-notification-read-ids';
const preferencesStorageKey = 'spendwise-notification-preferences';

const defaultPreferences: NotificationPreferences = {
  budget: true,
  ai: true,
  forecast: true,
  recurring: true,
  goal: true,
  transaction: true,
};

const categoryPreferenceKey: Record<NotificationCategory, NotificationPreferenceKey> = {
  Budget: 'budget',
  'AI Insight': 'ai',
  Forecast: 'forecast',
  Recurring: 'recurring',
  Goal: 'goal',
  Transaction: 'transaction',
};

const priorityRank: Record<NotificationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const categoryBadgeVariant: Record<
  NotificationCategory,
  'danger' | 'warning' | 'success' | 'info' | 'neutral'
> = {
  Budget: 'warning',
  'AI Insight': 'info',
  Forecast: 'warning',
  Recurring: 'info',
  Goal: 'success',
  Transaction: 'neutral',
};

const recurringHintPattern =
  /(subscription|membership|rent|renewal|bill|utility|utilities|mortgage|gym|monthly|insurance|plan|dues|stream|internet|phone)/i;

const getIsoNow = () => new Date().toISOString();

const getDifferenceInDays = (later: Date, earlier: Date) =>
  Math.round((later.getTime() - earlier.getTime()) / 86_400_000);

const getRelativeTime = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatShortDate(value);
};

const getDueLabel = (targetDate: string) => {
  const days = getDifferenceInDays(new Date(targetDate), new Date());

  if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  }

  if (days === 0) {
    return 'due today';
  }

  if (days === 1) {
    return 'due tomorrow';
  }

  return `due in ${days} days`;
};

const parseJsonArray = (value: string | null) => {
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

const parsePreferences = (value: string | null): NotificationPreferences => {
  if (!value) {
    return defaultPreferences;
  }

  try {
    const parsed = JSON.parse(value) as Partial<NotificationPreferences>;

    return {
      ...defaultPreferences,
      ...parsed,
    };
  } catch {
    return defaultPreferences;
  }
};

const resolveNotificationsError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const buildBudgetNotifications = (
  items: DashboardBudgetSummaryItem[],
  categoryNames: Map<string, string>,
) =>
  items
    .map((item): WorkspaceNotification | null => {
      const progress = item.limitAmount > 0 ? (item.spent / item.limitAmount) * 100 : 0;
      const categoryName = categoryNames.get(item.categoryId) ?? 'Uncategorized';

      if (item.isOverBudget) {
        return {
          id: `budget-over-${item.id}-${item.updatedAt}`,
          title: `${categoryName} budget exceeded`,
          detail: `${formatMoney(item.spent)} spent against a ${formatMoney(item.limitAmount)} limit.`,
          category: 'Budget',
          priority: 'high',
          createdAt: item.updatedAt,
          href: '/budgets',
          actionLabel: 'Review budget',
        };
      }

      if (progress >= 85) {
        return {
          id: `budget-near-${item.id}-${item.updatedAt}`,
          title: `${categoryName} is near its limit`,
          detail: `${Math.round(progress)}% of the monthly budget is already used.`,
          category: 'Budget',
          priority: 'medium',
          createdAt: item.updatedAt,
          href: '/budgets',
          actionLabel: 'Open budgets',
        };
      }

      return null;
    })
    .filter((item): item is WorkspaceNotification => item !== null);

const buildInsightNotifications = (insights: Insight[]) =>
  insights.slice(0, 4).map(
    (insight): WorkspaceNotification => ({
      id: `insight-${insight.id}-${insight.updatedAt}`,
      title: insight.title,
      detail: insight.message,
      category: 'AI Insight',
      priority:
        insight.type === 'anomaly' ? 'high' : insight.type === 'recommendation' ? 'medium' : 'low',
      createdAt: insight.updatedAt,
      href: '/dashboard',
      actionLabel: 'Open dashboard',
    }),
  );

const buildRecurringNotifications = (expenses: Expense[]) => {
  const grouped = new Map<string, Expense[]>();

  expenses.forEach((expense) => {
    if (!recurringHintPattern.test(`${expense.description} ${expense.notes ?? ''}`)) {
      return;
    }

    const key = `${expense.categoryId}:${expense.description.toLowerCase().trim()}`;
    const current = grouped.get(key) ?? [];
    current.push(expense);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((group): WorkspaceNotification | null => {
      const ordered = [...group].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      );
      const latest = ordered[0];

      if (!latest || ordered.length < 2) {
        return null;
      }

      const nextDate = new Date(latest.date);
      nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
      const dueInDays = getDifferenceInDays(nextDate, new Date());

      if (dueInDays < -10 || dueInDays > 10) {
        return null;
      }

      return {
        id: `recurring-${latest.id}-${nextDate.toISOString()}`,
        title: `${latest.description} may renew soon`,
        detail: `Based on repeated charges, the next ${formatMoney(latest.amount)} payment is ${getDueLabel(nextDate.toISOString())}.`,
        category: 'Recurring',
        priority: dueInDays <= 2 ? 'medium' : 'low',
        createdAt: latest.updatedAt,
        href: '/recurring',
        actionLabel: 'Review recurring',
      };
    })
    .filter((item): item is WorkspaceNotification => item !== null)
    .slice(0, 4);
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [activeCategory, setActiveCategory] = useState<'all' | NotificationCategory>('all');
  const [pageMessage, setPageMessage] = useState('');

  const { month, year } = getCurrentMonthYear();

  const analyticsQuery = useQuery({
    queryKey: dashboardAnalyticsQueryKey,
    queryFn: getDashboardAnalytics,
  });

  const categoriesQuery = useQuery({
    queryKey: transactionCategoriesQueryKey,
    queryFn: listTransactionCategories,
  });

  const goalsQuery = useQuery({
    queryKey: goalsQueryKey,
    queryFn: listGoals,
  });

  const expensesQuery = useQuery({
    queryKey: ['notifications', 'expenses', month, year] as const,
    queryFn: () => listExpenses({}),
  });

  useEffect(() => {
    setReadIds(new Set(parseJsonArray(window.localStorage.getItem(readStorageKey))));
    setPreferences(parsePreferences(window.localStorage.getItem(preferencesStorageKey)));
  }, []);

  const persistReadIds = (nextReadIds: Set<string>) => {
    setReadIds(nextReadIds);
    window.localStorage.setItem(readStorageKey, JSON.stringify(Array.from(nextReadIds)));
  };

  const persistPreferences = (nextPreferences: NotificationPreferences) => {
    setPreferences(nextPreferences);
    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(nextPreferences));
  };

  const categoryNames = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data],
  );

  const notifications = useMemo(() => {
    const analytics = analyticsQuery.data;
    const expenses = expensesQuery.data ?? [];
    const goals = goalsQuery.data ?? [];
    const generatedAt = getIsoNow();
    const generatedNotifications: WorkspaceNotification[] = [];

    if (analytics) {
      generatedNotifications.push(
        ...buildBudgetNotifications(analytics.budgetSummary.items, categoryNames),
        ...buildInsightNotifications(analytics.insights),
      );

      if (
        analytics.forecast &&
        analytics.forecast.predictedAmount > analytics.totals.totalExpenses * 1.1
      ) {
        generatedNotifications.push({
          id: `forecast-${analytics.forecast.id}-${analytics.forecast.generatedAt}`,
          title: 'Forecast is pacing above current spend',
          detail: `Monthly spend may reach ${formatMoney(analytics.forecast.predictedAmount)} with ${Math.round(
            analytics.forecast.confidence * 100,
          )}% confidence.`,
          category: 'Forecast',
          priority: 'medium',
          createdAt: analytics.forecast.generatedAt,
          href: '/forecasts',
          actionLabel: 'Review forecast',
        });
      }
    }

    generatedNotifications.push(...buildRecurringNotifications(expenses));

    expenses
      .filter((expense) => {
        const averageAmount =
          expenses.length > 0
            ? expenses.reduce((sum, item) => sum + item.amount, 0) / expenses.length
            : 0;

        return expense.amount >= Math.max(averageAmount * 2.2, 250);
      })
      .slice(0, 3)
      .forEach((expense) => {
        generatedNotifications.push({
          id: `transaction-large-${expense.id}-${expense.updatedAt}`,
          title: `${expense.description} looks larger than usual`,
          detail: `${formatMoney(expense.amount)} was logged on ${formatShortDate(expense.date)}.`,
          category: 'Transaction',
          priority: 'medium',
          createdAt: expense.updatedAt,
          href: '/transactions',
          actionLabel: 'Review transaction',
        });
      });

    goals.forEach((goal) => {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const daysUntilDue = getDifferenceInDays(new Date(goal.targetDate), new Date());

      if (remaining === 0) {
        generatedNotifications.push({
          id: `goal-complete-${goal.id}-${goal.updatedAt}`,
          title: `${goal.title} is fully funded`,
          detail: `You reached the ${formatMoney(goal.targetAmount)} target.`,
          category: 'Goal',
          priority: 'low',
          createdAt: goal.updatedAt,
          href: '/goals',
          actionLabel: 'Open goals',
        });
        return;
      }

      if (daysUntilDue <= 45 && progress < 80) {
        generatedNotifications.push({
          id: `goal-risk-${goal.id}-${goal.updatedAt}`,
          title: `${goal.title} needs attention`,
          detail: `${formatMoney(remaining)} remains and the target is ${getDueLabel(goal.targetDate)}.`,
          category: 'Goal',
          priority: daysUntilDue <= 14 ? 'high' : 'medium',
          createdAt: goal.updatedAt,
          href: '/goals',
          actionLabel: 'Review goal',
        });
      }
    });

    if (
      generatedNotifications.length === 0 &&
      !analyticsQuery.isLoading &&
      !expensesQuery.isLoading
    ) {
      generatedNotifications.push({
        id: `workspace-clear-${month}-${year}`,
        title: 'Workspace is quiet',
        detail:
          'No urgent budget, goal, forecast, or recurring reminders were found for the current data.',
        category: 'AI Insight',
        priority: 'low',
        createdAt: generatedAt,
        href: '/dashboard',
        actionLabel: 'Open dashboard',
      });
    }

    return generatedNotifications
      .filter((notification) => preferences[categoryPreferenceKey[notification.category]])
      .filter(
        (notification) => activeCategory === 'all' || notification.category === activeCategory,
      )
      .sort((left, right) => {
        const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [
    activeCategory,
    analyticsQuery.data,
    analyticsQuery.isLoading,
    categoryNames,
    expensesQuery.data,
    expensesQuery.isLoading,
    goalsQuery.data,
    month,
    preferences,
    year,
  ]);

  const unreadNotifications = notifications.filter((notification) => !readIds.has(notification.id));
  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === 'high',
  ).length;
  const isLoading =
    analyticsQuery.isLoading ||
    categoriesQuery.isLoading ||
    goalsQuery.isLoading ||
    expensesQuery.isLoading;
  const errorMessage = analyticsQuery.isError
    ? resolveNotificationsError(analyticsQuery.error, 'Unable to load dashboard signals.')
    : categoriesQuery.isError
      ? resolveNotificationsError(categoriesQuery.error, 'Unable to load categories.')
      : goalsQuery.isError
        ? resolveNotificationsError(goalsQuery.error, 'Unable to load goals.')
        : expensesQuery.isError
          ? resolveNotificationsError(expensesQuery.error, 'Unable to load expenses.')
          : '';

  const markNotificationRead = (notificationId: string) => {
    const nextReadIds = new Set(readIds);
    nextReadIds.add(notificationId);
    persistReadIds(nextReadIds);
  };

  const markAllRead = () => {
    persistReadIds(new Set([...readIds, ...notifications.map((notification) => notification.id)]));
    setPageMessage('All visible notifications marked as read.');
  };

  const refreshNotifications = async () => {
    setPageMessage('');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: dashboardAnalyticsQueryKey }),
      queryClient.invalidateQueries({ queryKey: transactionCategoriesQueryKey }),
      queryClient.invalidateQueries({ queryKey: goalsQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['notifications', 'expenses', month, year] }),
    ]);
    setPageMessage('Notifications refreshed from live workspace data.');
  };

  const togglePreference = (key: NotificationPreferenceKey) => {
    persistPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button asChild variant="soft">
              <Link href="/settings">Notification settings</Link>
            </Button>
            <Button disabled={notifications.length === 0} onClick={markAllRead} variant="secondary">
              Mark all read
            </Button>
          </>
        }
        description="Live reminders from budgets, goals, forecasts, recurring charges, insights, and transactions."
        eyebrow="Notifications"
        meta={
          <>
            <Badge variant={unreadNotifications.length ? 'info' : 'neutral'}>
              {unreadNotifications.length} unread
            </Badge>
            <Badge variant={highPriorityCount ? 'warning' : 'neutral'}>
              {highPriorityCount} high priority
            </Badge>
          </>
        }
        title="Keep users informed without overwhelming them."
      />

      {pageMessage ? (
        <div className="rounded-[22px] border border-brand/15 bg-brand/10 px-4 py-4 text-sm text-slate-700">
          {pageMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        {[
          {
            label: 'Unread',
            value: unreadNotifications.length.toString(),
            helper: 'Needs review',
            icon: BellRing,
          },
          {
            label: 'High priority',
            value: highPriorityCount.toString(),
            helper: 'Budget or goal risk',
            icon: TriangleAlert,
          },
          {
            label: 'Active channels',
            value: Object.values(preferences).filter(Boolean).length.toString(),
            helper: 'Preference toggles on',
            icon: CheckCheck,
          },
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <SurfaceCard key={metric.label} className="rounded-[28px] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-ink">{metric.value}</p>
                  <p className="mt-3 text-sm text-slate-500">{metric.helper}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </section>

      <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="kicker">Notification filters</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">Control the feed</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Filter by source, refresh live data, or mark the current view as read.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isLoading}
                onClick={() => void refreshNotifications()}
                variant="soft"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                disabled={notifications.length === 0}
                onClick={markAllRead}
                variant="secondary"
              >
                Mark visible read
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                'all',
                'Budget',
                'AI Insight',
                'Forecast',
                'Recurring',
                'Goal',
                'Transaction',
              ] as const
            ).map((category) => (
              <button
                key={category}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  activeCategory === category
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                )}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="kicker">Notification center</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                Prioritize the most actionable items first
              </h2>
            </div>
            <BellRing className="h-6 w-6 text-brand" />
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-[24px] border border-line bg-white/80 px-5 py-8 text-center text-sm text-slate-500">
              Loading live notifications...
            </div>
          ) : notifications.length > 0 ? (
            <div className="mt-6 space-y-4">
              {notifications.map((item) => {
                const unread = !readIds.has(item.id);

                return (
                  <article
                    key={item.id}
                    className={cn(
                      'rounded-[24px] border px-5 py-5 transition',
                      unread ? 'border-brand/25 bg-brand/5' : 'border-white/80 bg-white/80',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            'h-2.5 w-2.5 rounded-full',
                            unread ? 'bg-brand' : 'bg-slate-300',
                          )}
                        />
                        <p className="font-semibold text-ink">{item.title}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={categoryBadgeVariant[item.category]}>{item.category}</Badge>
                        <Badge
                          variant={
                            item.priority === 'high'
                              ? 'danger'
                              : item.priority === 'medium'
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-400">{getRelativeTime(item.createdAt)}</p>
                      <div className="flex flex-wrap gap-2">
                        {unread ? (
                          <Button
                            onClick={() => markNotificationRead(item.id)}
                            size="sm"
                            variant="soft"
                          >
                            Mark read
                          </Button>
                        ) : null}
                        <Button asChild size="sm" variant="secondary">
                          <Link href={item.href}>{item.actionLabel}</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              action={
                <Button onClick={() => setActiveCategory('all')} variant="soft">
                  Clear filter
                </Button>
              }
              className="mt-6 rounded-[24px] px-5 py-6"
              description="No notifications match this view. Try another category or turn channels back on."
              icon={BellRing}
              title="No notifications here"
            />
          )}
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <CheckCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="kicker">Preferences</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Choose what deserves a nudge</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                key: 'budget' as const,
                label: 'Budget warnings',
                description: 'Budget overages and near-limit alerts.',
                icon: Target,
              },
              {
                key: 'ai' as const,
                label: 'AI insights',
                description: 'Generated summaries, anomalies, and recommendations.',
                icon: Sparkles,
              },
              {
                key: 'forecast' as const,
                label: 'Forecast updates',
                description: 'Projected month-end pressure and forecast changes.',
                icon: Clock3,
              },
              {
                key: 'recurring' as const,
                label: 'Recurring reminders',
                description: 'Repeated charges and likely upcoming renewals.',
                icon: Repeat2,
              },
              {
                key: 'goal' as const,
                label: 'Goal reminders',
                description: 'Funding milestones and deadline risk.',
                icon: PiggyBank,
              },
              {
                key: 'transaction' as const,
                label: 'Transaction nudges',
                description: 'Large or unusual expenses that may need review.',
                icon: ReceiptText,
              },
            ].map((item) => {
              const Icon = item.icon;
              const enabled = preferences[item.key];

              return (
                <button
                  key={item.key}
                  className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-white/80 bg-white/80 px-4 py-4 text-left transition hover:border-brand/30"
                  onClick={() => togglePreference(item.key)}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-medium text-ink">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors',
                      enabled ? 'bg-brand' : 'bg-slate-300',
                    )}
                  >
                    <span
                      className={cn(
                        'h-5 w-5 rounded-full bg-white transition-transform',
                        enabled ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
