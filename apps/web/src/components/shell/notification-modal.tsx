'use client';

import { type Expense, formatShortDate, type Insight } from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  CircleX,
  PiggyBank,
  Receipt,
  RefreshCw,
  Repeat2,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  dashboardAnalyticsQueryKey,
  type DashboardBudgetSummaryItem,
  getDashboardAnalytics,
} from '@/lib/analytics/client';
import { useCurrentUserQuery } from '@/lib/auth/client';
import { formatMoney as baseFormatMoney } from '@/lib/formatters';
import { goalsQueryKey, listGoals } from '@/lib/goals/client';
import { useNotificationPreferences } from '@/lib/notifications/client';
import {
  type NotificationCategory,
  notificationCategoryPreferenceKey,
  notificationReadStorageKey,
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

const categoryConfig: Record<
  NotificationCategory,
  {
    icon: typeof Target;
    color: string;
    bg: string;
  }
> = {
  Budget: { icon: Target, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  'AI Insight': { icon: Sparkles, color: 'text-brand', bg: 'bg-brand/10 border-brand/20' },
  Forecast: { icon: TrendingUp, color: 'text-brand', bg: 'bg-brand/10 border-brand/20' },
  Recurring: { icon: Repeat2, color: 'text-emerald', bg: 'bg-emerald/10 border-emerald/20' },
  Goal: { icon: PiggyBank, color: 'text-emerald', bg: 'bg-emerald/10 border-emerald/20' },
  Transaction: { icon: Receipt, color: 'text-ink-soft', bg: 'bg-ink-soft/10 border-ink-soft/20' },
};

interface PanelPosition {
  left: number;
  top: number;
  width: number;
}

const panelEdgeGap = 16;
const panelMinWidth = 320;
const panelMaxWidth = 390;
const panelTopOffset = 12;

const getPanelPosition = (triggerRect: DOMRect): PanelPosition => {
  const width = Math.min(
    panelMaxWidth,
    Math.max(panelMinWidth, window.innerWidth - panelEdgeGap * 2),
  );
  const preferredLeft = triggerRect.right - width + 4;
  const left = Math.max(
    panelEdgeGap,
    Math.min(preferredLeft, window.innerWidth - width - panelEdgeGap),
  );

  return {
    left,
    top: triggerRect.bottom + panelTopOffset,
    width,
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
  formatMoney: (amount: number) => string,
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

const buildRecurringNotifications = (
  expenses: Expense[],
  formatMoney: (amount: number) => string,
) => {
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
  const { data: user } = useCurrentUserQuery();
  const formatMoney = useCallback(
    (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP'),
    [user?.currency],
  );
  const queryClient = useQueryClient();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({
    left: panelEdgeGap,
    top: 96,
    width: panelMaxWidth,
  });
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const {
    data: preferences = {
      budget: true,
      ai: true,
      forecast: true,
      recurring: true,
      goal: true,
      transaction: true,
    },
  } = useNotificationPreferences();

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
    queryKey: ['transactions', 'expenses'] as const,
    queryFn: () => listExpenses({}),
  });

  useEffect(() => {
    const syncNotificationSettings = () => {
      setReadIds(
        new Set(parseNotificationReadIds(window.localStorage.getItem(notificationReadStorageKey))),
      );
      setDismissedIds(
        new Set(
          parseNotificationReadIds(
            window.localStorage.getItem('spendwise-notification-dismissed-ids'),
          ),
        ),
      );
    };

    setIsMounted(true);
    syncNotificationSettings();

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === notificationReadStorageKey ||
        event.key === 'spendwise-notification-dismissed-ids'
      ) {
        syncNotificationSettings();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
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
        ...buildBudgetNotifications(analytics.budgetSummary.items, categoryNames, formatMoney),
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

    generated.push(...buildRecurringNotifications(expenses, formatMoney));

    // 1. Unusually large transactions
    const averageAmount =
      expenses.length > 0
        ? expenses.reduce((sum, expense) => sum + expense.amount, 0) / expenses.length
        : 0;

    const largeExpenseIds = new Set<string>();

    expenses
      .filter((expense) => expense.amount >= Math.max(averageAmount * 2.2, 250))
      .slice(0, 2)
      .forEach((expense) => {
        largeExpenseIds.add(expense.id);
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

    // 2. Recent expense activity (the newest expenses added recently)
    const sortedExpenses = [...expenses].sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime(),
    );

    sortedExpenses
      .filter((expense) => !largeExpenseIds.has(expense.id))
      .slice(0, 3)
      .forEach((expense) => {
        const categoryName = categoryNames.get(expense.categoryId) ?? 'General';
        generated.push({
          id: `transaction-recent-${expense.id}-${expense.updatedAt}`,
          title: `${expense.description} expense logged`,
          detail: `${formatMoney(expense.amount)} spent in ${categoryName} on ${formatShortDate(expense.date)}.`,
          category: 'Transaction',
          priority: 'low',
          createdAt: expense.updatedAt,
          href: '/transactions',
          actionLabel: 'View',
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
      .filter((notification) => !dismissedIds.has(notification.id))
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
  }, [
    analyticsQuery.data,
    categoryNames,
    dismissedIds,
    expensesQuery.data,
    formatMoney,
    goalsQuery.data,
    preferences,
  ]);

  const unreadNotifications = notifications.filter((notification) => !readIds.has(notification.id));
  const unreadCount = unreadNotifications.length;
  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === 'high',
  ).length;
  const visibleNotifications = unreadNotifications.slice(0, 6);
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

  const deleteNotification = (notificationId: string) => {
    const nextDismissed = new Set(dismissedIds);
    nextDismissed.add(notificationId);
    setDismissedIds(nextDismissed);
    window.localStorage.setItem(
      'spendwise-notification-dismissed-ids',
      JSON.stringify(Array.from(nextDismissed)),
    );
  };

  const clearAllNotifications = () => {
    const nextDismissed = new Set([
      ...dismissedIds,
      ...notifications.map((notification) => notification.id),
    ]);
    setDismissedIds(nextDismissed);
    window.localStorage.setItem(
      'spendwise-notification-dismissed-ids',
      JSON.stringify(Array.from(nextDismissed)),
    );
  };

  const refreshNotifications = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: dashboardAnalyticsQueryKey }),
      queryClient.invalidateQueries({ queryKey: transactionCategoriesQueryKey }),
      queryClient.invalidateQueries({ queryKey: goalsQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['transactions', 'expenses'] }),
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
                className="absolute flex max-h-[min(680px,calc(100vh-7rem))] flex-col overflow-hidden rounded-[30px] border border-line-strong bg-paper-strong/95 shadow-lift backdrop-blur-2xl"
                style={{
                  left: panelPosition.left,
                  top: panelPosition.top,
                  width: panelPosition.width,
                }}
              >
                <div className="border-b border-line px-5 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="kicker">Notifications</p>
                      <h2 className="mt-2 text-xl font-semibold text-ink">Live workspace alerts</h2>
                      <p className="mt-1 text-sm text-ink-soft">
                        {unreadCount
                          ? `${unreadCount} unread item${unreadCount === 1 ? '' : 's'}`
                          : 'All caught up'}
                      </p>
                    </div>
                    <button
                      aria-label="Close notifications"
                      className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-line bg-paper-strong text-ink-soft transition hover:border-brand/30 hover:bg-paper hover:text-ink"
                      onClick={() => setIsOpen(false)}
                      type="button"
                    >
                      <CircleX className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Button
                      className="h-9 flex-1 gap-1.5 px-3 text-xs font-semibold whitespace-nowrap"
                      disabled={isLoading}
                      onClick={() => void refreshNotifications()}
                      size="sm"
                      variant="soft"
                    >
                      <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                      <span>{isLoading ? 'Syncing' : 'Refresh'}</span>
                    </Button>
                    <Button
                      className="h-9 flex-[1.25] gap-1.5 px-3.5 text-xs font-semibold whitespace-nowrap"
                      disabled={unreadCount === 0}
                      onClick={markAllRead}
                      size="sm"
                      variant="soft"
                    >
                      <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Mark all read</span>
                    </Button>
                    <Button
                      className="h-9 flex-1 gap-1.5 px-3 text-xs font-semibold whitespace-nowrap"
                      disabled={notifications.length === 0 && !isLoading}
                      onClick={() => {
                        setIsOpen(false);
                        setIsAllModalOpen(true);
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <span>View all</span>
                    </Button>
                  </div>
                </div>

                <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
                  {isLoading ? (
                    <div className="rounded-2xl border border-line bg-paper px-4 py-8 text-center text-sm text-ink-soft">
                      Loading notifications...
                    </div>
                  ) : visibleNotifications.length > 0 ? (
                    <div className="space-y-2">
                      {visibleNotifications.map((notification) => {
                        const unread = !readIds.has(notification.id);
                        const categoryMeta = categoryConfig[notification.category];
                        const CategoryIcon = categoryMeta.icon;

                        return (
                          <article
                            key={notification.id}
                            className={cn(
                              'group relative flex items-start gap-3 rounded-2xl border p-3 transition-all duration-150',
                              unread
                                ? 'border-brand/25 bg-brand/[0.04] hover:bg-brand/[0.07]'
                                : 'border-line/70 bg-paper/60 hover:border-line hover:bg-paper-strong',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border',
                                categoryMeta.bg,
                                categoryMeta.color,
                              )}
                            >
                              <CategoryIcon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  {unread ? (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                  ) : null}
                                  <span className="truncate text-[10.5px] font-semibold uppercase tracking-wider text-ink-soft">
                                    {notification.category}
                                  </span>
                                  <span className="text-[10px] text-ink-soft/40">•</span>
                                  <span className="shrink-0 text-[11px] text-ink-soft">
                                    {getRelativeTime(notification.createdAt)}
                                  </span>
                                </div>

                                {notification.priority === 'high' ? (
                                  <span className="shrink-0 rounded-md bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                                    Urgent
                                  </span>
                                ) : null}
                              </div>

                              <h4 className="mt-0.5 text-[13px] font-semibold leading-snug text-ink">
                                {notification.title}
                              </h4>
                              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">
                                {notification.detail}
                              </p>

                              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line/40 pt-2">
                                <div className="flex items-center gap-3">
                                  {unread ? (
                                    <button
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft transition hover:text-ink"
                                      onClick={() => markRead(notification.id)}
                                      type="button"
                                    >
                                      <Check className="h-3 w-3" />
                                      Mark read
                                    </button>
                                  ) : null}

                                  <button
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft transition hover:text-danger"
                                    onClick={() => deleteNotification(notification.id)}
                                    title="Remove notification"
                                    type="button"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Remove
                                  </button>
                                </div>

                                <Link
                                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand transition hover:text-brand-strong"
                                  href={notification.href}
                                  onClick={() => setIsOpen(false)}
                                >
                                  <span>{notification.actionLabel}</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-line bg-paper/60 px-4 py-7 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                        <CheckCheck className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-ink">All caught up</p>
                      <p className="mx-auto mt-1 max-w-[230px] text-xs text-ink-soft">
                        No unread notifications. Past alerts can be reviewed in the archive.
                      </p>
                      {notifications.length > 0 ? (
                        <Button
                          className="mt-3 h-7.5 px-3 text-[11.5px]"
                          onClick={() => {
                            setIsOpen(false);
                            setIsAllModalOpen(true);
                          }}
                          size="sm"
                          variant="soft"
                        >
                          View past alerts
                        </Button>
                      ) : null}
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
                className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsAllModalOpen(false)}
                type="button"
              />
              <div className="absolute left-1/2 top-1/2 flex max-h-[min(760px,calc(100vh-3rem))] w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[34px] border border-line-strong bg-paper-strong shadow-lift">
                <div className="border-b border-line px-6 py-6">
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
                      className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-line bg-paper-strong text-ink-soft transition hover:border-brand/30 hover:bg-paper hover:text-ink"
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
                      disabled={unreadCount === 0}
                      onClick={markAllRead}
                      size="sm"
                      variant="soft"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </Button>
                    <Button
                      disabled={notifications.length === 0}
                      onClick={() => setIsConfirmClearOpen(true)}
                      size="sm"
                      variant="outline"
                      className="text-danger hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all
                    </Button>
                  </div>
                </div>

                <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
                  {isLoading ? (
                    <div className="rounded-2xl border border-line bg-paper px-5 py-10 text-center text-sm text-ink-soft">
                      Loading notifications...
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-2.5">
                      {notifications.map((notification) => {
                        const unread = !readIds.has(notification.id);
                        const categoryMeta = categoryConfig[notification.category];
                        const CategoryIcon = categoryMeta.icon;

                        return (
                          <article
                            className={cn(
                              'group relative flex items-start gap-3.5 rounded-2xl border p-3.5 transition-all duration-150',
                              unread
                                ? 'border-brand/25 bg-brand/[0.04] hover:bg-brand/[0.07]'
                                : 'border-line/70 bg-paper/60 hover:border-line hover:bg-paper-strong',
                            )}
                            key={notification.id}
                          >
                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                                categoryMeta.bg,
                                categoryMeta.color,
                              )}
                            >
                              <CategoryIcon className="h-4.5 w-4.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  {unread ? (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                  ) : null}
                                  <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                                    {notification.category}
                                  </span>
                                  <span className="text-[10px] text-ink-soft/40">•</span>
                                  <span className="shrink-0 text-[12px] text-ink-soft">
                                    {getRelativeTime(notification.createdAt)}
                                  </span>
                                </div>

                                {notification.priority === 'high' ? (
                                  <span className="shrink-0 rounded-md bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                                    Urgent
                                  </span>
                                ) : null}
                              </div>

                              <h3 className="mt-1 text-[13.5px] font-semibold leading-snug text-ink">
                                {notification.title}
                              </h3>
                              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
                                {notification.detail}
                              </p>

                              <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/40 pt-2">
                                <div className="flex items-center gap-3">
                                  {unread ? (
                                    <button
                                      className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-ink"
                                      onClick={() => markRead(notification.id)}
                                      type="button"
                                    >
                                      <Check className="h-3 w-3" />
                                      Mark read
                                    </button>
                                  ) : null}

                                  <button
                                    className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-danger"
                                    onClick={() => deleteNotification(notification.id)}
                                    title="Delete notification"
                                    type="button"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </div>

                                <Link
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition hover:text-brand-strong"
                                  href={notification.href}
                                  onClick={() => setIsAllModalOpen(false)}
                                >
                                  <span>{notification.actionLabel}</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-line bg-paper px-5 py-12 text-center">
                      <Bell className="mx-auto h-7 w-7 text-brand" />
                      <p className="mt-4 text-lg font-semibold text-ink">No notifications yet</p>
                      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-ink-soft">
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

      {isConfirmClearOpen && isMounted
        ? createPortal(
            <div
              aria-modal="true"
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              role="alertdialog"
            >
              <button
                aria-label="Cancel clear all"
                className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsConfirmClearOpen(false)}
                type="button"
              />
              <div className="relative flex w-[min(92vw,440px)] flex-col overflow-hidden rounded-[30px] border border-line-strong bg-paper-strong p-6 shadow-lift">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                  <Trash2 className="h-6 w-6" />
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-ink">Clear all notifications?</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    This will permanently remove all {notifications.length} workspace alerts from
                    your notification feed. This action cannot be undone.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
                  <Button onClick={() => setIsConfirmClearOpen(false)} size="sm" variant="soft">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      clearAllNotifications();
                      setIsConfirmClearOpen(false);
                    }}
                    size="sm"
                    variant="danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all alerts
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
