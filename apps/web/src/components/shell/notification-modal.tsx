'use client';

import {
  type Expense,
  formatShortDate,
  getCurrentMonthYear,
  type Insight,
} from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, CircleX, RefreshCw, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  dashboardAnalyticsQueryKey,
  type DashboardBudgetSummaryItem,
  getDashboardAnalytics,
} from '@/lib/analytics/client';
import { formatMoney } from '@/lib/formatters';
import { goalsQueryKey, listGoals } from '@/lib/goals/client';
import {
  defaultNotificationPreferences,
  type NotificationCategory,
  notificationCategoryPreferenceKey,
  type NotificationPreferences,
  notificationPreferencesChangedEvent,
  notificationPreferencesStorageKey,
  notificationReadStorageKey,
  parseNotificationPreferences,
  parseNotificationReadIds,
} from '@/lib/notifications/preferences';
import {
  listExpenses,
  listTransactionCategories,
  transactionCategoriesQueryKey,
} from '@/lib/transactions/client';
import { cn } from '@/lib/utils';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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

const recurringHintPattern =
  /(subscription|membership|rent|renewal|bill|utility|utilities|mortgage|gym|monthly|insurance|plan|dues|stream|internet|phone)/i;

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

interface PanelPosition {
  left: number;
  top: number;
  width: number;
}

const panelEdgeGap = 16;
const panelMinWidth = 300;
const panelMaxWidth = 360;
const panelTopOffset = 12;

const getPanelPosition = (triggerRect: DOMRect): PanelPosition => {
  const preferredLeft = triggerRect.right - 8;
  const maxLeft = window.innerWidth - panelMinWidth - panelEdgeGap;
  const left = Math.max(panelEdgeGap, Math.min(preferredLeft, maxLeft));
  const availableWidth = window.innerWidth - left - panelEdgeGap;

  return {
    left,
    top: triggerRect.bottom + panelTopOffset,
    width: Math.min(panelMaxWidth, Math.max(panelMinWidth, availableWidth)),
  };
};

const getDifferenceInDays = (later: Date, earlier: Date) =>
  Math.round((later.getTime() - earlier.getTime()) / 86_400_000);

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

const getRelativeTime = (value: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));

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
          detail: `${formatMoney(item.spent)} spent against ${formatMoney(item.limitAmount)}.`,
          category: 'Budget',
          priority: 'high',
          createdAt: item.updatedAt,
          href: '/budgets',
          actionLabel: 'Review',
        };
      }

      if (progress >= 85) {
        return {
          id: `budget-near-${item.id}-${item.updatedAt}`,
          title: `${categoryName} is near its limit`,
          detail: `${Math.round(progress)}% of this budget has been used.`,
          category: 'Budget',
          priority: 'medium',
          createdAt: item.updatedAt,
          href: '/budgets',
          actionLabel: 'Open',
        };
      }

      return null;
    })
    .filter((item): item is WorkspaceNotification => item !== null);

const buildInsightNotifications = (insights: Insight[]) =>
  insights.slice(0, 3).map(
    (insight): WorkspaceNotification => ({
      id: `insight-${insight.id}-${insight.updatedAt}`,
      title: insight.title,
      detail: insight.message,
      category: 'AI Insight',
      priority:
        insight.type === 'anomaly' ? 'high' : insight.type === 'recommendation' ? 'medium' : 'low',
      createdAt: insight.updatedAt,
      href: '/dashboard',
      actionLabel: 'View',
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
        detail: `Expected ${formatMoney(latest.amount)} payment is ${getDueLabel(nextDate.toISOString())}.`,
        category: 'Recurring',
        priority: dueInDays <= 2 ? 'medium' : 'low',
        createdAt: latest.updatedAt,
        href: '/recurring',
        actionLabel: 'Review',
      };
    })
    .filter((item): item is WorkspaceNotification => item !== null);
};

export const HeaderNotificationModal = () => {
  const queryClient = useQueryClient();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({
    left: panelEdgeGap,
    top: 96,
    width: panelMaxWidth,
  });
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences,
  );
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
    const syncNotificationSettings = () => {
      setReadIds(
        new Set(parseNotificationReadIds(window.localStorage.getItem(notificationReadStorageKey))),
      );
      setPreferences(
        parseNotificationPreferences(
          window.localStorage.getItem(notificationPreferencesStorageKey),
        ),
      );
    };

    setIsMounted(true);
    syncNotificationSettings();

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === notificationReadStorageKey ||
        event.key === notificationPreferencesStorageKey
      ) {
        syncNotificationSettings();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(notificationPreferencesChangedEvent, syncNotificationSettings);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(notificationPreferencesChangedEvent, syncNotificationSettings);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePanelPosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();

      if (!triggerRect) {
        return;
      }

      setPanelPosition(getPanelPosition(triggerRect));
    };

    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);

    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setReadIds(
      new Set(parseNotificationReadIds(window.localStorage.getItem(notificationReadStorageKey))),
    );
    setPreferences(
      parseNotificationPreferences(window.localStorage.getItem(notificationPreferencesStorageKey)),
    );
  }, [isOpen]);

  const persistReadIds = (nextReadIds: Set<string>) => {
    setReadIds(nextReadIds);
    window.localStorage.setItem(
      notificationReadStorageKey,
      JSON.stringify(Array.from(nextReadIds)),
    );
  };

  const categoryNames = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data],
  );

  const notifications = useMemo(() => {
    const generated: WorkspaceNotification[] = [];
    const analytics = analyticsQuery.data;
    const expenses = expensesQuery.data ?? [];
    const goals = goalsQuery.data ?? [];

    if (analytics) {
      generated.push(
        ...buildBudgetNotifications(analytics.budgetSummary.items, categoryNames),
        ...buildInsightNotifications(analytics.insights),
      );

      if (
        analytics.forecast &&
        analytics.forecast.predictedAmount > analytics.totals.totalExpenses * 1.1
      ) {
        generated.push({
          id: `forecast-${analytics.forecast.id}-${analytics.forecast.generatedAt}`,
          title: 'Forecast is pacing higher',
          detail: `Month-end spend may reach ${formatMoney(analytics.forecast.predictedAmount)}.`,
          category: 'Forecast',
          priority: 'medium',
          createdAt: analytics.forecast.generatedAt,
          href: '/forecasts',
          actionLabel: 'Open',
        });
      }
    }

    generated.push(...buildRecurringNotifications(expenses));

    const averageAmount =
      expenses.length > 0
        ? expenses.reduce((sum, expense) => sum + expense.amount, 0) / expenses.length
        : 0;

    expenses
      .filter((expense) => expense.amount >= Math.max(averageAmount * 2.2, 250))
      .slice(0, 2)
      .forEach((expense) => {
        generated.push({
          id: `transaction-large-${expense.id}-${expense.updatedAt}`,
          title: `${expense.description} looks larger than usual`,
          detail: `${formatMoney(expense.amount)} was logged on ${formatShortDate(expense.date)}.`,
          category: 'Transaction',
          priority: 'medium',
          createdAt: expense.updatedAt,
          href: '/transactions',
          actionLabel: 'Review',
        });
      });

    goals.forEach((goal) => {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const daysUntilDue = getDifferenceInDays(new Date(goal.targetDate), new Date());

      if (remaining === 0) {
        generated.push({
          id: `goal-complete-${goal.id}-${goal.updatedAt}`,
          title: `${goal.title} is fully funded`,
          detail: `You reached the ${formatMoney(goal.targetAmount)} target.`,
          category: 'Goal',
          priority: 'low',
          createdAt: goal.updatedAt,
          href: '/goals',
          actionLabel: 'Open',
        });
        return;
      }

      if (daysUntilDue <= 45 && progress < 80) {
        generated.push({
          id: `goal-risk-${goal.id}-${goal.updatedAt}`,
          title: `${goal.title} needs attention`,
          detail: `${formatMoney(remaining)} remains and the target is ${getDueLabel(goal.targetDate)}.`,
          category: 'Goal',
          priority: daysUntilDue <= 14 ? 'high' : 'medium',
          createdAt: goal.updatedAt,
          href: '/goals',
          actionLabel: 'Review',
        });
      }
    });

    return generated
      .filter(
        (notification) => preferences[notificationCategoryPreferenceKey[notification.category]],
      )
      .sort((left, right) => {
        const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [analyticsQuery.data, categoryNames, expensesQuery.data, goalsQuery.data, preferences]);

  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length;
  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === 'high',
  ).length;
  const visibleNotifications = notifications.slice(0, 6);
  const isLoading =
    analyticsQuery.isLoading ||
    categoriesQuery.isLoading ||
    goalsQuery.isLoading ||
    expensesQuery.isLoading;

  const markRead = (notificationId: string) => {
    const nextReadIds = new Set(readIds);
    nextReadIds.add(notificationId);
    persistReadIds(nextReadIds);
  };

  const markAllRead = () => {
    persistReadIds(new Set([...readIds, ...notifications.map((notification) => notification.id)]));
  };

  const refreshNotifications = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: dashboardAnalyticsQueryKey }),
      queryClient.invalidateQueries({ queryKey: transactionCategoriesQueryKey }),
      queryClient.invalidateQueries({ queryKey: goalsQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['notifications', 'expenses', month, year] }),
    ]);
  };

  return (
    <>
      <Button
        aria-expanded={isOpen}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative"
        onClick={() => {
          const triggerRect = triggerRef.current?.getBoundingClientRect();

          if (triggerRect) {
            setPanelPosition(getPanelPosition(triggerRect));
          }

          setIsOpen((currentValue) => !currentValue);
        }}
        ref={triggerRef}
        size="icon"
        type="button"
        variant="soft"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {isOpen && isMounted
        ? createPortal(
            <div aria-modal="true" className="fixed inset-0 z-50" role="dialog">
              <button
                aria-label="Close notifications"
                className="absolute inset-0 h-full w-full cursor-default bg-transparent"
                onClick={() => setIsOpen(false)}
                type="button"
              />
              <div
                className="absolute flex max-h-[min(680px,calc(100vh-7rem))] flex-col overflow-hidden rounded-[30px] border border-white/80 bg-[rgba(255,253,250,0.98)] shadow-lift backdrop-blur-2xl"
                style={{
                  left: panelPosition.left,
                  top: panelPosition.top,
                  width: panelPosition.width,
                }}
              >
                <div className="border-b border-line/80 px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="kicker">Notifications</p>
                      <h2 className="mt-2 text-xl font-semibold text-ink">Live workspace alerts</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {unreadCount
                          ? `${unreadCount} unread item${unreadCount === 1 ? '' : 's'}`
                          : 'All caught up'}
                      </p>
                    </div>
                    <button
                      aria-label="Close notifications"
                      className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
                      onClick={() => setIsOpen(false)}
                      type="button"
                    >
                      <CircleX className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button
                      className="gap-1.5 px-2 text-[12px]"
                      disabled={isLoading}
                      onClick={() => void refreshNotifications()}
                      size="sm"
                      variant="soft"
                    >
                      <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                      {isLoading ? 'Syncing' : 'Refresh'}
                    </Button>
                    <Button
                      className="gap-1.5 px-2 text-[12px]"
                      disabled={notifications.length === 0}
                      onClick={markAllRead}
                      size="sm"
                      variant="soft"
                    >
                      <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                      Mark all read
                    </Button>
                    <Button
                      className="gap-1.5 px-2 text-[12px]"
                      disabled={notifications.length === 0 && !isLoading}
                      onClick={() => {
                        setIsOpen(false);
                        setIsAllModalOpen(true);
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      View all
                    </Button>
                  </div>
                </div>

                <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  {isLoading ? (
                    <div className="rounded-[22px] border border-line bg-white/80 px-4 py-8 text-center text-sm text-slate-500">
                      Loading notifications...
                    </div>
                  ) : visibleNotifications.length > 0 ? (
                    <div className="space-y-3">
                      {visibleNotifications.map((notification) => {
                        const unread = !readIds.has(notification.id);

                        return (
                          <article
                            key={notification.id}
                            className={cn(
                              'rounded-[22px] border px-4 py-4 transition',
                              unread ? 'border-brand/25 bg-brand/5' : 'border-white/80 bg-white/80',
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      'h-2.5 w-2.5 rounded-full',
                                      unread ? 'bg-brand' : 'bg-slate-300',
                                    )}
                                  />
                                  <p className="font-semibold leading-snug text-ink">
                                    {notification.title}
                                  </p>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {notification.detail}
                                </p>
                              </div>
                              <TriangleAlert
                                className={cn(
                                  'mt-0.5 h-4 w-4 shrink-0',
                                  notification.priority === 'high' ? 'text-danger' : 'text-brand',
                                )}
                              />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={categoryBadgeVariant[notification.category]}>
                                  {notification.category}
                                </Badge>
                                <span className="text-xs font-medium text-slate-400">
                                  {getRelativeTime(notification.createdAt)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {unread ? (
                                  <button
                                    className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                                    onClick={() => markRead(notification.id)}
                                    type="button"
                                  >
                                    Read
                                  </button>
                                ) : null}
                                <Link
                                  className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b645b]"
                                  href={notification.href}
                                  onClick={() => setIsOpen(false)}
                                >
                                  {notification.actionLabel}
                                </Link>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-line bg-white/70 px-4 py-8 text-center">
                      <Bell className="mx-auto h-6 w-6 text-brand" />
                      <p className="mt-3 font-semibold text-ink">No notifications yet</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Budget, goal, recurring, and insight alerts will appear here automatically.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {isAllModalOpen && isMounted
        ? createPortal(
            <div aria-modal="true" className="fixed inset-0 z-[60]" role="dialog">
              <button
                aria-label="Close all notifications"
                className="absolute inset-0 h-full w-full cursor-default bg-ink/20 backdrop-blur-sm"
                onClick={() => setIsAllModalOpen(false)}
                type="button"
              />
              <div className="absolute left-1/2 top-1/2 flex max-h-[min(760px,calc(100vh-3rem))] w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[34px] border border-white/80 bg-[rgba(255,253,250,0.98)] shadow-lift">
                <div className="border-b border-line/80 px-6 py-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="kicker">Notification center</p>
                      <h2 className="mt-2 text-2xl font-semibold text-ink">All alerts</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant={unreadCount ? 'info' : 'neutral'}>
                          {unreadCount} unread
                        </Badge>
                        <Badge variant={highPriorityCount ? 'warning' : 'neutral'}>
                          {highPriorityCount} high priority
                        </Badge>
                      </div>
                    </div>
                    <button
                      aria-label="Close all notifications"
                      className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
                      onClick={() => setIsAllModalOpen(false)}
                      type="button"
                    >
                      <CircleX className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      disabled={isLoading}
                      onClick={() => void refreshNotifications()}
                      size="sm"
                      variant="soft"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {isLoading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button
                      disabled={notifications.length === 0}
                      onClick={markAllRead}
                      size="sm"
                      variant="secondary"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </Button>
                  </div>
                </div>

                <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
                  {isLoading ? (
                    <div className="rounded-[24px] border border-line bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
                      Loading notifications...
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.map((notification) => {
                        const unread = !readIds.has(notification.id);

                        return (
                          <article
                            className={cn(
                              'rounded-[24px] border px-5 py-5 transition',
                              unread ? 'border-brand/25 bg-brand/5' : 'border-white/80 bg-white/85',
                            )}
                            key={notification.id}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      'h-2.5 w-2.5 rounded-full',
                                      unread ? 'bg-brand' : 'bg-slate-300',
                                    )}
                                  />
                                  <h3 className="font-semibold leading-snug text-ink">
                                    {notification.title}
                                  </h3>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {notification.detail}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-2">
                                <Badge variant={categoryBadgeVariant[notification.category]}>
                                  {notification.category}
                                </Badge>
                                <Badge
                                  variant={
                                    notification.priority === 'high'
                                      ? 'danger'
                                      : notification.priority === 'medium'
                                        ? 'warning'
                                        : 'neutral'
                                  }
                                >
                                  {notification.priority}
                                </Badge>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              <span className="text-xs font-medium text-slate-400">
                                {getRelativeTime(notification.createdAt)}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {unread ? (
                                  <Button
                                    onClick={() => markRead(notification.id)}
                                    size="sm"
                                    variant="soft"
                                  >
                                    Mark read
                                  </Button>
                                ) : null}
                                <Button asChild size="sm" variant="secondary">
                                  <Link
                                    href={notification.href}
                                    onClick={() => setIsAllModalOpen(false)}
                                  >
                                    {notification.actionLabel}
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-dashed border-line bg-white/70 px-5 py-12 text-center">
                      <Bell className="mx-auto h-7 w-7 text-brand" />
                      <p className="mt-4 text-lg font-semibold text-ink">No notifications yet</p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Budget, goal, recurring, and insight alerts will appear here automatically.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
