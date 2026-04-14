'use client';

import { getCurrentMonthYear } from '@spendwise/shared';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  CalendarRange,
  Download,
  FileText,
  Printer,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { CategoryComparisonChart, SpendingOverviewChart } from '@/components/charts/finance-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { getBudgetSummary } from '@/lib/budgets/client';
import { formatMoney } from '@/lib/formatters';
import {
  listExpenses,
  listTransactionCategories,
  transactionCategoriesQueryKey,
} from '@/lib/transactions/client';

type BudgetStatus = 'danger' | 'warning' | 'safe';

const getInitialMonthValue = () => {
  const { month, year } = getCurrentMonthYear();
  return `${year}-${String(month).padStart(2, '0')}`;
};

const parseMonthValue = (value: string) => {
  const [yearValue, monthValue] = value.split('-');
  const year = Number(yearValue ?? '');
  const month = Number(monthValue ?? '');

  return {
    month: Number.isFinite(month) && month > 0 ? month : 1,
    year: Number.isFinite(year) && year > 0 ? year : new Date().getUTCFullYear(),
  };
};

const getMonthLabel = (month: number, year: number) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));

const shiftMonth = (month: number, year: number, offset: number) => {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));

  return {
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
};

const getHistoryMonths = (month: number, year: number, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const point = shiftMonth(month, year, index - (count - 1));

    return {
      ...point,
      label: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(point.year, point.month - 1, 1))),
    };
  });

const calculateDelta = (current: number, previous: number) => {
  if (!previous) {
    return current ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
};

const resolveReportsError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const statusRank: Record<BudgetStatus, number> = {
  danger: 0,
  warning: 1,
  safe: 2,
};

export default function ReportsPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonthValue());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pageMessage, setPageMessage] = useState('');

  const { month, year } = parseMonthValue(monthValue);
  const previousPeriod = shiftMonth(month, year, -1);
  const historyMonths = useMemo(() => getHistoryMonths(month, year, 6), [month, year]);

  const categoriesQuery = useQuery({
    queryKey: transactionCategoriesQueryKey,
    queryFn: listTransactionCategories,
  });

  const periodQueries = useQueries({
    queries: [
      {
        queryKey: ['reports', 'expenses', month, year, categoryFilter] as const,
        queryFn: () =>
          listExpenses({
            month,
            year,
            categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
          }),
      },
      {
        queryKey: [
          'reports',
          'expenses',
          previousPeriod.month,
          previousPeriod.year,
          categoryFilter,
        ] as const,
        queryFn: () =>
          listExpenses({
            month: previousPeriod.month,
            year: previousPeriod.year,
            categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
          }),
      },
      {
        queryKey: ['reports', 'budgets', month, year] as const,
        queryFn: () => getBudgetSummary(month, year),
      },
    ],
  });

  const historyQueries = useQueries({
    queries: historyMonths.map((point) => ({
      queryKey: ['reports', 'history', point.month, point.year, categoryFilter] as const,
      queryFn: async () => {
        const [expenses, budgetSummary] = await Promise.all([
          listExpenses({
            month: point.month,
            year: point.year,
            categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
          }),
          getBudgetSummary(point.month, point.year),
        ]);

        return {
          label: point.label,
          expenses,
          budgetSummary,
        };
      },
    })),
  });

  const categories = categoriesQuery.data ?? [];
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const currentExpenses = periodQueries[0].data ?? [];
  const previousExpenses = periodQueries[1].data ?? [];
  const currentBudgetSummary = periodQueries[2].data;

  const totalCurrent = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalPrevious = previousExpenses.reduce((sum, item) => sum + item.amount, 0);

  const comparisonByCategory = new Map<
    string,
    {
      label: string;
      current: number;
      previous: number;
      color: string;
    }
  >();

  currentExpenses.forEach((expense) => {
    const category = categoryById.get(expense.categoryId);
    const current = comparisonByCategory.get(expense.categoryId);

    comparisonByCategory.set(expense.categoryId, {
      label: category?.name ?? 'Uncategorized',
      current: (current?.current ?? 0) + expense.amount,
      previous: current?.previous ?? 0,
      color: category?.color ?? '#94A3B8',
    });
  });

  previousExpenses.forEach((expense) => {
    const category = categoryById.get(expense.categoryId);
    const current = comparisonByCategory.get(expense.categoryId);

    comparisonByCategory.set(expense.categoryId, {
      label: category?.name ?? 'Uncategorized',
      current: current?.current ?? 0,
      previous: (current?.previous ?? 0) + expense.amount,
      color: category?.color ?? '#94A3B8',
    });
  });

  const reportBars = Array.from(comparisonByCategory.values()).sort(
    (left, right) => right.current - left.current,
  );
  const topMover =
    reportBars.reduce<(typeof reportBars)[number] | null>((leader, item) => {
      const leaderShift = leader ? Math.abs(leader.current - leader.previous) : -1;
      const itemShift = Math.abs(item.current - item.previous);

      return !leader || itemShift > leaderShift ? item : leader;
    }, null) ?? null;

  const spendingTrend = historyQueries
    .map((query, index) => {
      const point = historyMonths[index];

      if (!query.data || !point) {
        return null;
      }

      const spend = query.data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const budget = query.data.budgetSummary.items
        .filter((item) => categoryFilter === 'all' || item.categoryId === categoryFilter)
        .reduce((sum, item) => sum + item.limitAmount, 0);

      return {
        label: point.label,
        spend,
        budget,
        forecast: spend,
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
      } => point !== null,
    );

  const budgetViews = (currentBudgetSummary?.items ?? [])
    .filter((item) => categoryFilter === 'all' || item.categoryId === categoryFilter)
    .map((item) => {
      const category = categoryById.get(item.categoryId);
      const progress = item.limitAmount > 0 ? (item.spent / item.limitAmount) * 100 : 0;
      const status: BudgetStatus = item.isOverBudget
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
    .sort((left, right) => statusRank[left.status] - statusRank[right.status]);

  const budgetOverages = budgetViews.filter((budget) => budget.status === 'danger').length;
  const budgetWarnings = budgetViews.filter((budget) => budget.status === 'warning').length;
  const categoryFocusLabel =
    categoryFilter === 'all'
      ? 'All categories'
      : (categoryById.get(categoryFilter)?.name ?? 'Selected category');
  const periodSpendDelta = calculateDelta(totalCurrent, totalPrevious);

  const summaryText = reportBars.length
    ? `${categoryFocusLabel} ${periodSpendDelta >= 0 ? 'rose' : 'fell'} ${Math.abs(periodSpendDelta)}% from ${getMonthLabel(previousPeriod.month, previousPeriod.year)} to ${getMonthLabel(month, year)}. ${
        topMover ? `${topMover.label} moved the most.` : 'Category movement is limited this period.'
      } ${
        budgetOverages > 0
          ? `${budgetOverages} budget${budgetOverages === 1 ? '' : 's'} are over limit.`
          : budgetWarnings > 0
            ? `${budgetWarnings} budget${budgetWarnings === 1 ? ' is' : 's are'} near limit.`
            : 'Budgets are currently under control.'
      }`
    : 'No report activity for the selected period yet.';

  const handleExportCsv = () => {
    if (reportBars.length === 0) {
      setPageMessage('There is no report data to export for the selected period.');
      return;
    }

    const lines = [
      ['Category', 'Current', 'Previous', 'Change'].join(','),
      ...reportBars.map((item) =>
        [
          item.label,
          item.current.toFixed(2),
          item.previous.toFixed(2),
          (item.current - item.previous).toFixed(2),
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${year}-${String(month).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setPageMessage('CSV report exported.');
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const isLoading =
    categoriesQuery.isLoading ||
    periodQueries.some((query) => query.isLoading) ||
    historyQueries.some((query) => query.isLoading);

  const errorMessage = categoriesQuery.isError
    ? resolveReportsError(categoriesQuery.error, 'Unable to load categories right now.')
    : periodQueries[0].isError
      ? resolveReportsError(periodQueries[0].error, 'Unable to load current period expenses.')
      : periodQueries[1].isError
        ? resolveReportsError(periodQueries[1].error, 'Unable to load comparison expenses.')
        : periodQueries[2].isError
          ? resolveReportsError(periodQueries[2].error, 'Unable to load budget summary.')
          : historyQueries.find((query) => query.isError)
            ? resolveReportsError(
                historyQueries.find((query) => query.isError)?.error,
                'Unable to load report history.',
              )
            : '';

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button onClick={handleExportCsv} variant="soft">
              Export CSV
            </Button>
            <Button onClick={handlePrintSummary} variant="secondary">
              Print summary
            </Button>
          </>
        }
        description="Compare live periods, review budget pressure, and export what changed."
        eyebrow="Reports"
        meta={
          <>
            <Badge variant="neutral">Date filters</Badge>
            <Badge variant="info">Print ready</Badge>
          </>
        }
        title="See the monthly story fast."
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
        <MetricCard
          delta="Current"
          helper={getMonthLabel(month, year)}
          icon={TrendingUp}
          label="Period spend"
          value={formatMoney(totalCurrent)}
        />
        <MetricCard
          delta="Previous"
          helper={getMonthLabel(previousPeriod.month, previousPeriod.year)}
          icon={FileText}
          label="Comparison baseline"
          tone="mint"
          value={formatMoney(totalPrevious)}
        />
        <MetricCard
          delta={topMover ? `${periodSpendDelta >= 0 ? '+' : ''}${periodSpendDelta}%` : 'No shift'}
          helper={topMover?.label ?? 'No category data'}
          icon={CalendarRange}
          label="Top mover"
          value={topMover?.label ?? 'No data'}
        />
      </section>

      <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto]">
            <div className="flex flex-wrap gap-3">
              <Input
                className="w-[190px]"
                onChange={(event) => setMonthValue(event.target.value)}
                type="month"
                value={monthValue}
              />
              <select
                className="flex h-12 rounded-[20px] border border-line bg-white px-4 text-sm font-medium text-slate-600 outline-none transition focus:border-brand"
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand/30 hover:text-ink"
                onClick={() => {
                  setMonthValue(getInitialMonthValue());
                  setCategoryFilter('all');
                  setPageMessage('');
                }}
                type="button"
              >
                Reset filters
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handlePrintSummary} variant="soft">
                <Printer className="h-4 w-4" />
                Print summary
              </Button>
              <Button onClick={handleExportCsv} variant="soft">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-brand/10 bg-[linear-gradient(140deg,rgba(15,123,113,0.08),rgba(255,255,255,0.92))] px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="kicker">Report snapshot</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">
                  The story should be clear fast.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{summaryText}</p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link href="/dashboard">
                  <SlidersHorizontal className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Mode
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">{getMonthLabel(month, year)}</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Export
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">CSV + print</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Focus
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">{categoryFocusLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <section className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard className="rounded-[30px] px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Category comparison</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Current vs previous
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Compare category shifts fast.
              </p>
            </div>
            <Badge variant="info">Current vs previous</Badge>
          </div>

          {reportBars.length > 0 ? (
            <div className="mt-5">
              <CategoryComparisonChart data={reportBars} />
            </div>
          ) : (
            <EmptyState
              action={
                <Button asChild variant="soft">
                  <Link href="/transactions">Add expenses</Link>
                </Button>
              }
              className="mt-5 rounded-[24px] px-5 py-6"
              description="Once there is spending in the selected months, category comparison will appear here."
              icon={TrendingUp}
              title="No comparison data yet"
            />
          )}
        </SurfaceCard>

        <SurfaceCard className="rounded-[30px] px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Trend analysis</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Monthly trend
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">Trend stays close.</p>
            </div>
            <Badge variant="neutral">Budget overlay</Badge>
          </div>

          {isLoading ? (
            <div className="mt-5 rounded-[24px] border border-line bg-white/80 px-5 py-8 text-center text-sm text-slate-500">
              Loading report history...
            </div>
          ) : spendingTrend.length > 0 ? (
            <div className="mt-5">
              <SpendingOverviewChart data={spendingTrend} />
            </div>
          ) : (
            <EmptyState
              action={
                <Button asChild variant="soft">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              }
              className="mt-5 rounded-[24px] px-5 py-6"
              description="The trend chart appears once at least one month in the selected window has live expenses."
              icon={CalendarRange}
              title="No trend data yet"
            />
          )}
        </SurfaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Budget performance</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Budget performance
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Budget use inside the report.
              </p>
            </div>
            <Button asChild variant="soft">
              <Link href="/budgets">Budgets</Link>
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
                          Status
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
                description="Budget performance will appear once the selected period has budget limits."
                icon={FileText}
                title="No budget summary yet"
              />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Printable summary</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Export-ready summary
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">Clean and ready to share.</p>
            </div>
            <Badge variant="info">PDF ready</Badge>
          </div>

          <div className="mt-5 rounded-[26px] border border-white/80 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-brand">SpendWise</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Monthly summary</h2>
                <p className="mt-2 text-sm text-slate-500">{getMonthLabel(month, year)}</p>
              </div>
              <FileText className="h-5 w-5 text-brand" />
            </div>

            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
              {[
                ['Spent', formatMoney(totalCurrent)],
                ['Baseline', formatMoney(totalPrevious)],
                ['Change', `${periodSpendDelta >= 0 ? '+' : ''}${periodSpendDelta}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] bg-sage/30 px-3.5 py-4 md:px-4">
                  <p className="text-sm leading-6 text-slate-500">{label}</p>
                  <p className="mt-2 break-words text-[1.45rem] font-semibold leading-tight text-ink md:text-xl">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-white/80 bg-slate-50 px-4 py-5 md:px-5">
              <p className="font-semibold text-ink">Summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{summaryText}</p>
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
