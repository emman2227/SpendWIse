'use client';

import { formatShortDate, getCurrentMonthYear, type PaymentMethod } from '@spendwise/shared';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, PiggyBank, ReceiptText, Sparkles, Target, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { CategoryShareChart, SpendingOverviewChart } from '@/components/charts/finance-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  dashboardAnalyticsQueryKey,
  generateAnalytics,
  getDashboardAnalytics,
} from '@/lib/analytics/client';
import { getBudgetSummary } from '@/lib/budgets/client';
import { formatDelta, formatMoney } from '@/lib/formatters';
import { goalsQueryKey, listGoals } from '@/lib/goals/client';
import {
  listExpenses,
  listTransactionCategories,
  transactionCategoriesQueryKey,
} from '@/lib/transactions/client';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  credit_card: 'Credit card',
  debit_card: 'Debit card',
  bank_transfer: 'Bank transfer',
  e_wallet: 'E-wallet',
};

const getMonthBuckets = (count: number) => {
  const { month, year } = getCurrentMonthYear();

  return Array.from({ length: count }, (_, index) => {
    const point = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));

    return {
      month: point.getUTCMonth() + 1,
      year: point.getUTCFullYear(),
      label: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        timeZone: 'UTC',
      }).format(point),
    };
  });
};

const calculateDelta = (current: number, previous: number) => {
  if (!previous) {
    return current ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
};

const resolveDashboardError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getInsightBadge = (type: string) => {
  if (type === 'anomaly') {
    return {
      label: 'Anomaly',
      variant: 'warning' as const,
    };
  }

  if (type === 'recommendation') {
    return {
      label: 'Recommendation',
      variant: 'success' as const,
    };
  }

  return {
    label: 'Summary',
    variant: 'info' as const,
  };
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [pageMessage, setPageMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const historyMonths = useMemo(() => getMonthBuckets(6), []);
  const currentMonth = historyMonths[historyMonths.length - 1];

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

  const historyQueries = useQueries({
    queries: historyMonths.map((point) => ({
      queryKey: ['dashboard', 'history', point.month, point.year] as const,
      queryFn: async () => {
        const [expenses, budgetSummary] = await Promise.all([
          listExpenses({
            month: point.month,
            year: point.year,
          }),
          getBudgetSummary(point.month, point.year),
        ]);

        return {
          label: point.label,
          month: point.month,
          year: point.year,
          expenses,
          budgetSummary,
        };
      },
    })),
  });

  const analytics = analyticsQuery.data;
  const categories = categoriesQuery.data ?? [];
  const goals = goalsQuery.data ?? [];
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const spendingTrend = historyQueries
    .map((query, index) => {
      const point = historyMonths[index];

      if (!query.data || !point) {
        return null;
      }

      const spend = query.data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const budget = query.data.budgetSummary.items.reduce(
        (sum, item) => sum + item.limitAmount,
        0,
      );
      const forecast =
        currentMonth && point.month === currentMonth.month && point.year === currentMonth.year
          ? (analytics?.forecast?.predictedAmount ?? spend)
          : spend;

      return {
        label: point.label,
        spend,
        budget,
        forecast,
        transactionCount: query.data.expenses.length,
      };
    })
    .filter(
      (
        point,
      ): point is {
        label: string;
        spend: number;
        budget: number;
        forecast: number;
        transactionCount: number;
      } => point !== null,
    );

  const currentTrendPoint = spendingTrend[spendingTrend.length - 1];
  const previousTrendPoint = spendingTrend[spendingTrend.length - 2];

  const totalSpent = analytics?.totals.totalExpenses ?? currentTrendPoint?.spend ?? 0;
  const totalBudget =
    analytics?.budgetSummary.items.reduce((sum, item) => sum + item.limitAmount, 0) ??
    currentTrendPoint?.budget ??
    0;
  const remainingBudget = totalBudget - totalSpent;
  const transactionCount =
    analytics?.totals.transactionCount ?? currentTrendPoint?.transactionCount ?? 0;
  const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;
  const spendDelta = calculateDelta(totalSpent, previousTrendPoint?.spend ?? 0);
  const remainingDelta = calculateDelta(
    remainingBudget,
    (previousTrendPoint?.budget ?? 0) - (previousTrendPoint?.spend ?? 0),
  );
  const transactionDelta = calculateDelta(
    transactionCount,
    previousTrendPoint?.transactionCount ?? 0,
  );

  const totalGoalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalGoalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const goalProgress =
    totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0;
  const completedGoals = goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length;
  const leadingGoal =
    goals.reduce<(typeof goals)[number] | null>((leader, goal) => {
      const leaderProgress =
        leader && leader.targetAmount > 0 ? leader.currentAmount / leader.targetAmount : -1;
      const goalProgressValue = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;

      return !leader || goalProgressValue > leaderProgress ? goal : leader;
    }, null) ?? null;

  const categoryShare = (analytics?.categoryBreakdown ?? [])
    .map((entry) => {
      const category = categoryById.get(entry.categoryId);

      return {
        name: category?.name ?? 'Uncategorized',
        amount: entry.amount,
        share: totalSpent > 0 ? Math.round((entry.amount / totalSpent) * 100) : 0,
        color: category?.color ?? '#94A3B8',
      };
    })
    .sort((left, right) => right.amount - left.amount);

  const topCategory = categoryShare[0] ?? null;

  const budgetViews = (analytics?.budgetSummary.items ?? [])
    .map((item) => {
      const category = categoryById.get(item.categoryId);
      const progress = item.limitAmount > 0 ? (item.spent / item.limitAmount) * 100 : 0;
      const status: 'danger' | 'warning' | 'safe' = item.isOverBudget
        ? 'danger'
        : progress >= 85
          ? 'warning'
          : 'safe';

      return {
        ...item,
        name: category?.name ?? 'Uncategorized',
        progress,
        status,
      };
    })
    .sort((left, right) => right.progress - left.progress);

  const recentTransactions = (analytics?.recentTransactions ?? []).map((expense) => ({
    ...expense,
    categoryName: categoryById.get(expense.categoryId)?.name ?? 'Uncategorized',
  }));

  const dashboardError = analyticsQuery.isError
    ? resolveDashboardError(analyticsQuery.error, 'Unable to load the dashboard right now.')
    : categoriesQuery.isError
      ? resolveDashboardError(categoriesQuery.error, 'Unable to load categories right now.')
      : goalsQuery.isError
        ? resolveDashboardError(goalsQuery.error, 'Unable to load goals right now.')
        : '';

  const isLoading =
    analyticsQuery.isLoading ||
    categoriesQuery.isLoading ||
    goalsQuery.isLoading ||
    historyQueries.some((query) => query.isLoading);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    setPageMessage('');

    try {
      await generateAnalytics();
      await queryClient.invalidateQueries({ queryKey: dashboardAnalyticsQueryKey });
      setPageMessage('AI insights refreshed.');
    } catch (error) {
      setPageMessage(resolveDashboardError(error, 'Unable to refresh AI insights right now.'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button
              disabled={isGenerating}
              onClick={() => void handleGenerateInsights()}
              variant="soft"
            >
              {isGenerating
                ? 'Refreshing...'
                : analytics?.insights.length
                  ? 'Refresh AI'
                  : 'Generate AI'}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/transactions">Add expense</Link>
            </Button>
          </>
        }
        description="Your key numbers now come from the live workspace, not demo data."
        eyebrow="Dashboard"
        meta={
          <>
            <Badge variant={analytics?.insights.length ? 'info' : 'neutral'}>
              {analytics?.insights.length ? 'AI ready' : 'AI not generated'}
            </Badge>
            <Badge variant="neutral">
              {analytics?.forecast
                ? `Updated ${formatShortDate(analytics.forecast.generatedAt)}`
                : 'Live totals'}
            </Badge>
          </>
        }
        title="See what needs attention."
      />

      {pageMessage ? (
        <div className="rounded-[22px] border border-brand/15 bg-brand/10 px-4 py-4 text-sm text-slate-700">
          {pageMessage}
        </div>
      ) : null}

      {dashboardError ? (
        <div className="rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
          {dashboardError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          delta={formatDelta(spendDelta)}
          helper={currentMonth ? `${currentMonth.label} spending` : 'Current month'}
          icon={Wallet}
          label="Total spent"
          value={formatMoney(totalSpent)}
        />
        <MetricCard
          delta={formatDelta(remainingDelta)}
          helper={`${budgetViews.length} budgets this month`}
          icon={Target}
          label="Budget left"
          value={
            remainingBudget >= 0
              ? formatMoney(remainingBudget)
              : `-${formatMoney(Math.abs(remainingBudget))}`
          }
        />
        <MetricCard
          delta={formatDelta(transactionDelta)}
          helper={transactionCount ? `Avg ${formatMoney(averageTransaction)}` : 'No expenses yet'}
          icon={ReceiptText}
          label="Monthly transactions"
          value={transactionCount.toString()}
        />
        <MetricCard
          delta={completedGoals ? `${completedGoals} complete` : 'Track savings'}
          helper={leadingGoal?.title ?? 'Create your first goal'}
          icon={PiggyBank}
          label="Goal progress"
          tone="mint"
          value={`${goalProgress}%`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SurfaceCard className="rounded-[32px] px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Spending overview</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">Spending vs budget</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">6 months</Badge>
              <Badge variant="info">
                {analytics?.forecast ? 'Forecast ready' : 'Live totals only'}
              </Badge>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-5 rounded-[24px] border border-line bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
              Loading dashboard history...
            </div>
          ) : spendingTrend.length > 0 ? (
            <>
              <div className="mt-5">
                <SpendingOverviewChart data={spendingTrend} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[20px] border border-white/80 bg-white/78 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Spend
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">{formatMoney(totalSpent)}</p>
                </div>
                <div className="rounded-[20px] border border-white/80 bg-white/78 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Left
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {remainingBudget >= 0
                      ? formatMoney(remainingBudget)
                      : `-${formatMoney(Math.abs(remainingBudget))}`}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/80 bg-white/78 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Forecast
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {analytics?.forecast
                      ? formatMoney(analytics.forecast.predictedAmount)
                      : 'Not ready'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              action={
                <Button asChild variant="soft">
                  <Link href="/transactions">Add your first expense</Link>
                </Button>
              }
              className="mt-5 rounded-[24px] px-5 py-6"
              description="Once expenses and budgets exist, the dashboard will chart how spending moves over time."
              icon={Wallet}
              title="No spending history yet"
            />
          )}
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-5 py-5 md:px-6 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="kicker">Category mix</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">Category mix</h2>
            </div>
            <ArrowUpRight className="h-5 w-5 text-brand" />
          </div>

          {categoryShare.length > 0 ? (
            <>
              <div className="mt-4">
                <CategoryShareChart data={categoryShare} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/80 bg-white/78 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Top
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {topCategory?.name ?? 'No category'}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/80 bg-white/78 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Share
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">{topCategory?.share ?? 0}%</p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {categoryShare.slice(0, 4).map((category) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-ink">{category.name}</span>
                    </div>
                    <span className="text-slate-500">
                      {formatMoney(category.amount)} / {category.share}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              action={
                <Button asChild variant="soft">
                  <Link href="/categories">Open categories</Link>
                </Button>
              }
              className="mt-5 rounded-[24px] px-5 py-6"
              description="Category share appears once this month has expenses attached to your categories."
              icon={Target}
              title="No category mix yet"
            />
          )}
        </SurfaceCard>
      </section>

      <section className="space-y-6">
        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Budget pressure</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Budget pressure
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Risk first, details close.
              </p>
            </div>
            <Button asChild variant="soft">
              <Link href="/budgets">Open budgets</Link>
            </Button>
          </div>

          <div className="mt-5 space-y-2.5">
            {budgetViews.length > 0 ? (
              budgetViews.map((budget) => (
                <article
                  key={budget.id}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                >
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(220px,0.95fr),minmax(260px,1.15fr)] lg:items-center lg:gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-semibold text-ink">{budget.name}</p>
                        <Badge
                          variant={
                            budget.status === 'danger'
                              ? 'danger'
                              : budget.status === 'warning'
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {budget.status === 'danger'
                            ? 'Exceeded'
                            : budget.status === 'warning'
                              ? 'Near limit'
                              : 'On track'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Monthly budget</p>
                    </div>

                    <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3">
                      <ProgressBar
                        helper={`${formatMoney(budget.spent)} of ${formatMoney(budget.limitAmount)}`}
                        size="sm"
                        status={budget.status}
                        value={budget.progress}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2.5 border-t border-line/70 pt-3 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:gap-2.5">
                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Left
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                          {budget.remaining >= 0
                            ? formatMoney(budget.remaining)
                            : `-${formatMoney(Math.abs(budget.remaining))}`}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Pace
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                          {budget.status === 'danger'
                            ? 'High'
                            : budget.status === 'warning'
                              ? 'Watch'
                              : 'Good'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button asChild size="sm" variant="soft">
                        <Link href="/budgets">Adjust</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                action={
                  <Button asChild variant="soft">
                    <Link href="/budgets">Create budget</Link>
                  </Button>
                }
                className="rounded-[24px] px-5 py-6"
                description="Budgets appear here once you add monthly limits to your categories."
                icon={Target}
                title="No budgets yet"
              />
            )}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard className="rounded-[30px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">AI insights</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                What changed
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">Short, useful summaries.</p>
            </div>
            <Button
              disabled={isGenerating}
              onClick={() => void handleGenerateInsights()}
              size="sm"
              variant="soft"
            >
              {isGenerating
                ? 'Refreshing...'
                : analytics?.insights.length
                  ? 'Refresh AI'
                  : 'Generate AI'}
            </Button>
          </div>

          <div className="mt-5 grid gap-2.5">
            {analytics?.insights.length ? (
              analytics.insights.map((insight) => {
                const badge = getInsightBadge(insight.type);

                return (
                  <article
                    key={insight.id}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <Sparkles className="h-4 w-4 shrink-0 text-slate-300" />
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-snug text-ink">
                      {insight.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{insight.message}</p>
                  </article>
                );
              })
            ) : (
              <EmptyState
                action={
                  <Button
                    disabled={isGenerating}
                    onClick={() => void handleGenerateInsights()}
                    variant="soft"
                  >
                    {isGenerating ? 'Generating...' : 'Generate insights'}
                  </Button>
                }
                className="rounded-[24px] px-5 py-6"
                description="The analytics engine can summarize your live spending once you ask it to generate a snapshot."
                icon={Sparkles}
                title="No AI insights yet"
              />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[30px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Recent transactions</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Recent activity
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">Latest charges, trimmed.</p>
            </div>
            <Button asChild size="sm" variant="soft">
              <Link href="/transactions">View all</Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-2.5">
            {recentTransactions.length > 0 ? (
              recentTransactions.slice(0, 4).map((transaction) => (
                <article
                  key={transaction.id}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{transaction.description}</p>
                        <Badge variant="neutral">{transaction.categoryName}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatShortDate(transaction.date)} /{' '}
                        {paymentMethodLabels[transaction.paymentMethod]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-ink">{formatMoney(transaction.amount)}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.notes ?? 'Expense logged'}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                action={
                  <Button asChild variant="soft">
                    <Link href="/transactions">Add expense</Link>
                  </Button>
                }
                className="rounded-[24px] px-5 py-6"
                description="Recent activity will appear here after the first few expenses land."
                icon={ReceiptText}
                title="No transactions yet"
              />
            )}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
