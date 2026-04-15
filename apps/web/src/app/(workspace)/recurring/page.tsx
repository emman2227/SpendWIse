'use client';

import {
  type Category,
  type Expense,
  formatShortDate,
  type PaymentMethod,
} from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CreditCard, Repeat2, Sparkles, TriangleAlert, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import { formatConfidence, formatMoney } from '@/lib/formatters';
import { listExpenses, listTransactionCategories } from '@/lib/transactions/client';
import { cn } from '@/lib/utils';

type RecurringStatus = 'upcoming' | 'renewing' | 'paused';
type RecurringFilter = 'all' | RecurringStatus;

interface CadenceSpec {
  kind: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  label: string;
  everyDays: number;
  tolerance: number;
  monthlyFactor: number;
  upcomingWindowDays: number;
  pauseGraceDays: number;
  monthStep?: number;
}

interface RecurringSeries {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  averageAmount: number;
  lastAmount: number;
  nextCharge: string;
  lastCharge: string;
  frequency: string;
  paymentMethod: PaymentMethod;
  status: RecurringStatus;
  cadenceDays: number;
  monthlyCost: number;
  transactionCount: number;
  confidence: number;
  dueInDays: number;
  notes?: string;
}

const recurringQueryKey = ['recurring', 'expenses'] as const;
const recurringCategoriesQueryKey = ['recurring', 'categories'] as const;

const recurringHintPattern =
  /(subscription|membership|rent|renewal|bill|utility|utilities|mortgage|gym|monthly|insurance|plan|dues|stream|internet|phone)/i;

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  credit_card: 'Credit card',
  debit_card: 'Debit card',
  bank_transfer: 'Bank transfer',
  e_wallet: 'E-wallet',
};

const cadenceSpecs: CadenceSpec[] = [
  {
    kind: 'weekly',
    label: 'Weekly',
    everyDays: 7,
    tolerance: 2,
    monthlyFactor: 52 / 12,
    upcomingWindowDays: 4,
    pauseGraceDays: 6,
  },
  {
    kind: 'biweekly',
    label: 'Every 2 weeks',
    everyDays: 14,
    tolerance: 3,
    monthlyFactor: 26 / 12,
    upcomingWindowDays: 5,
    pauseGraceDays: 8,
  },
  {
    kind: 'monthly',
    label: 'Monthly',
    everyDays: 30,
    tolerance: 5,
    monthlyFactor: 1,
    upcomingWindowDays: 10,
    pauseGraceDays: 12,
    monthStep: 1,
  },
  {
    kind: 'quarterly',
    label: 'Quarterly',
    everyDays: 91,
    tolerance: 12,
    monthlyFactor: 1 / 3,
    upcomingWindowDays: 14,
    pauseGraceDays: 20,
    monthStep: 3,
  },
  {
    kind: 'yearly',
    label: 'Yearly',
    everyDays: 365,
    tolerance: 20,
    monthlyFactor: 1 / 12,
    upcomingWindowDays: 30,
    pauseGraceDays: 45,
    monthStep: 12,
  },
];

const normalizeDescription = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\d+\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const getDifferenceInDays = (later: Date, earlier: Date) =>
  Math.round((later.getTime() - earlier.getTime()) / 86_400_000);

const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const addMonthsPreservingUtcDay = (value: Date, months: number) => {
  const next = new Date(value);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toTitleCase = (value: string) =>
  value.replace(
    /\w\S*/g,
    (part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`,
  );

const getMostCommonValue = <T,>(items: T[]) => {
  const counts = new Map<T, number>();

  items.forEach((item) => {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  });

  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? items[0];
};

const resolveCadence = (intervals: number[], hasHint: boolean) => {
  if (intervals.length === 0) {
    return null;
  }

  const ranked = cadenceSpecs
    .map((spec) => {
      const averageDrift = average(
        intervals.map((interval) => Math.abs(interval - spec.everyDays)),
      );
      const withinTolerance = intervals.filter(
        (interval) => Math.abs(interval - spec.everyDays) <= spec.tolerance,
      ).length;
      const intervalScore = withinTolerance / intervals.length;
      const driftScore = clamp(1 - averageDrift / (spec.tolerance * 2), 0, 1);
      const score = intervalScore * 0.7 + driftScore * 0.3;

      return {
        spec,
        score,
        intervalScore,
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];

  if (!best) {
    return null;
  }

  if (!hasHint && best.spec.kind === 'weekly' && intervals.length < 2) {
    return null;
  }

  if (best.score < (hasHint ? 0.42 : 0.54)) {
    return null;
  }

  if (!hasHint && best.intervalScore < 0.5) {
    return null;
  }

  return best.spec;
};

const getRecurringStatus = (nextCharge: Date, cadence: CadenceSpec, now: Date) => {
  const dueInDays = getDifferenceInDays(nextCharge, now);

  if (dueInDays < -cadence.pauseGraceDays) {
    return {
      status: 'paused' as const,
      dueInDays,
    };
  }

  if (dueInDays <= cadence.upcomingWindowDays) {
    return {
      status: 'upcoming' as const,
      dueInDays,
    };
  }

  return {
    status: 'renewing' as const,
    dueInDays,
  };
};

const getDueLabel = (dueInDays: number) => {
  if (dueInDays < 0) {
    return `${Math.abs(dueInDays)} day${Math.abs(dueInDays) === 1 ? '' : 's'} overdue`;
  }

  if (dueInDays === 0) {
    return 'Due today';
  }

  if (dueInDays === 1) {
    return 'Due tomorrow';
  }

  return `Due in ${dueInDays} days`;
};

const resolveRecurringError = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const detectRecurringSeries = (expenses: Expense[], categories: Category[]) => {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const groups = new Map<string, Expense[]>();

  expenses.forEach((expense) => {
    const normalized = normalizeDescription(expense.description);

    if (!normalized) {
      return;
    }

    const key = `${expense.categoryId}:${normalized}`;
    const current = groups.get(key) ?? [];
    current.push(expense);
    groups.set(key, current);
  });

  const now = new Date();
  const series: RecurringSeries[] = [];

  Array.from(groups.values()).forEach((groupExpenses) => {
    const ordered = [...groupExpenses].sort(
      (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
    );

    if (ordered.length < 2) {
      return;
    }

    const intervals = ordered.slice(1).map((expense, index) => {
      const currentDate = new Date(expense.date);
      const previousExpense = ordered[index];

      return previousExpense ? getDifferenceInDays(currentDate, new Date(previousExpense.date)) : 0;
    });

    const averageAmount = average(ordered.map((expense) => expense.amount));
    const amountDrift =
      averageAmount > 0
        ? average(
            ordered.map((expense) => Math.abs(expense.amount - averageAmount) / averageAmount),
          )
        : 0;
    const hasHint = ordered.some((expense) =>
      recurringHintPattern.test(`${expense.description} ${expense.notes ?? ''}`),
    );
    const cadence = resolveCadence(intervals, hasHint);

    if (!cadence) {
      return;
    }

    if (!hasHint && amountDrift > 0.22 && ordered.length < 4) {
      return;
    }

    const lastExpense = ordered[ordered.length - 1];

    if (!lastExpense) {
      return;
    }

    const lastChargeDate = new Date(lastExpense.date);
    const staleCutoff = Math.max(cadence.everyDays * 6, 540);

    if (getDifferenceInDays(now, lastChargeDate) > staleCutoff) {
      return;
    }

    const nextChargeDate = cadence.monthStep
      ? addMonthsPreservingUtcDay(lastChargeDate, cadence.monthStep)
      : addDays(lastChargeDate, cadence.everyDays);
    const { status, dueInDays } = getRecurringStatus(nextChargeDate, cadence, now);
    const intervalAccuracy = clamp(
      1 -
        average(intervals.map((interval) => Math.abs(interval - cadence.everyDays))) /
          (cadence.tolerance * 2),
      0,
      1,
    );
    const amountAccuracy = clamp(1 - amountDrift / 0.35, 0, 1);
    const historyBonus = clamp((ordered.length - 1) / 4, 0, 1);
    const confidence = clamp(
      0.44 +
        intervalAccuracy * 0.28 +
        amountAccuracy * 0.18 +
        historyBonus * 0.08 +
        (hasHint ? 0.07 : 0),
      0.5,
      0.98,
    );
    const dominantCategory = categoryById.get(lastExpense.categoryId);
    const dominantPaymentMethod =
      getMostCommonValue(ordered.map((expense) => expense.paymentMethod)) ??
      lastExpense.paymentMethod;

    series.push({
      id: `${lastExpense.categoryId}:${normalizeDescription(lastExpense.description)}`,
      name: toTitleCase(normalizeDescription(lastExpense.description)),
      categoryId: lastExpense.categoryId,
      categoryName: dominantCategory?.name ?? 'Uncategorized',
      averageAmount: roundMoney(averageAmount),
      lastAmount: roundMoney(lastExpense.amount),
      nextCharge: nextChargeDate.toISOString(),
      lastCharge: lastExpense.date,
      frequency: cadence.label,
      paymentMethod: dominantPaymentMethod,
      status,
      cadenceDays: cadence.everyDays,
      monthlyCost: roundMoney(averageAmount * cadence.monthlyFactor),
      transactionCount: ordered.length,
      confidence,
      dueInDays,
      notes: lastExpense.notes,
    });
  });

  return series.sort((left, right) => {
    const statusRank = { upcoming: 0, renewing: 1, paused: 2 } as const;
    const statusDifference = statusRank[left.status] - statusRank[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return new Date(left.nextCharge).getTime() - new Date(right.nextCharge).getTime();
  });
};

export default function RecurringPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecurringFilter>('all');

  const expensesQuery = useQuery({
    queryKey: recurringQueryKey,
    queryFn: () => listExpenses({}),
  });

  const categoriesQuery = useQuery({
    queryKey: recurringCategoriesQueryKey,
    queryFn: listTransactionCategories,
  });

  const expenses = expensesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const recurringSeries = useMemo(
    () => detectRecurringSeries(expenses, categories),
    [categories, expenses],
  );

  const visibleSeries = recurringSeries.filter((series) => {
    const matchesSearch =
      !searchValue ||
      `${series.name} ${series.categoryName} ${series.frequency} ${paymentMethodLabels[series.paymentMethod]}`
        .toLowerCase()
        .includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || series.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const monthlyRecurringTotal = visibleSeries
    .filter((series) => series.status !== 'paused')
    .reduce((sum, series) => sum + series.monthlyCost, 0);
  const activeRenewals = visibleSeries.filter((series) => series.status !== 'paused').length;
  const upcomingCharges = visibleSeries.filter((series) => series.status === 'upcoming');
  const pausedCharges = visibleSeries.filter((series) => series.status === 'paused');
  const largestSeries =
    visibleSeries.reduce<RecurringSeries | null>(
      (largest, series) =>
        !largest || series.monthlyCost > largest.monthlyCost ? series : largest,
      null,
    ) ??
    recurringSeries.reduce<RecurringSeries | null>(
      (largest, series) =>
        !largest || series.monthlyCost > largest.monthlyCost ? series : largest,
      null,
    );
  const nextCharge =
    recurringSeries.find((series) => series.status === 'upcoming') ??
    recurringSeries.find((series) => series.status === 'renewing') ??
    null;

  const insights = [
    largestSeries
      ? `${largestSeries.name} is your biggest detected repeat at about ${formatMoney(largestSeries.monthlyCost)} per month.`
      : 'Add more expenses and recurring patterns will start to surface here.',
    nextCharge
      ? `${nextCharge.name} ${getDueLabel(nextCharge.dueInDays).toLowerCase()} on ${formatShortDate(nextCharge.nextCharge)}.`
      : 'No upcoming renewals are predicted from your current expense history.',
    pausedCharges.length > 0
      ? `${pausedCharges.length} detected pattern${pausedCharges.length === 1 ? ' looks' : 's look'} overdue. Confirm whether those charges were cancelled or simply late.`
      : 'No paused patterns detected from the current timeline.',
  ];

  const handleDetectNow = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: recurringQueryKey }),
      queryClient.invalidateQueries({ queryKey: recurringCategoriesQueryKey }),
    ]);
  };

  const isLoading = expensesQuery.isLoading || categoriesQuery.isLoading;
  const isError = expensesQuery.isError || categoriesQuery.isError;
  const errorMessage = expensesQuery.isError
    ? resolveRecurringError(expensesQuery.error, 'Unable to load expenses right now.')
    : categoriesQuery.isError
      ? resolveRecurringError(categoriesQuery.error, 'Unable to load categories right now.')
      : '';

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button disabled={isLoading} onClick={() => void handleDetectNow()} variant="soft">
              Detect now
            </Button>
            <Button asChild variant="secondary">
              <Link href="/transactions">Review transactions</Link>
            </Button>
          </>
        }
        description="Detect repeating charges from live expenses and see what is due next."
        eyebrow="Recurring"
        meta={
          <>
            <Badge variant="neutral">Live detection</Badge>
            <Badge variant="info">{recurringSeries.length} patterns found</Badge>
          </>
        }
        title="Track recurring spend."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          delta={activeRenewals ? `${activeRenewals} active` : 'No active repeats'}
          helper="Estimated from live history"
          icon={Wallet}
          label="Recurring spend"
          value={formatMoney(monthlyRecurringTotal)}
        />
        <MetricCard
          delta={upcomingCharges.length ? `${upcomingCharges.length} upcoming` : 'Nothing due soon'}
          helper="Next 10 days"
          icon={CalendarClock}
          tone="mint"
          label="Upcoming charges"
          value={upcomingCharges.length.toString()}
        />
        <MetricCard
          delta={pausedCharges.length ? `${pausedCharges.length} paused` : 'No overdue patterns'}
          helper="Needs review"
          icon={Repeat2}
          label="Detected repeats"
          value={recurringSeries.length.toString()}
        />
      </section>

      <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto]">
            <Input
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search recurring charges"
              value={searchValue}
            />
            <Button asChild variant="soft">
              <Link href="/transactions">Open transactions</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All'],
              ['upcoming', 'Upcoming'],
              ['renewing', 'Renewing'],
              ['paused', 'Paused'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  statusFilter === value
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink',
                )}
                onClick={() => setStatusFilter(value as RecurringFilter)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Largest
              </p>
              <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                {largestSeries?.name ?? 'No recurring pattern yet'}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Next due
              </p>
              <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                {nextCharge ? formatShortDate(nextCharge.nextCharge) : 'No upcoming charge'}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Watch
              </p>
              <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                {pausedCharges.length > 0 ? 'Paused or late renewals' : 'Stable recurring flow'}
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Upcoming charges</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                What lands next
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Predictions are based on repeated timing and amount patterns.
              </p>
            </div>
            <CalendarClock className="h-5 w-5 text-brand" />
          </div>

          {isError ? (
            <div className="mt-5 rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-32 rounded-full" />
                      <Skeleton className="mt-2 h-3 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Skeleton className="h-14 w-full rounded-[16px]" />
                    <Skeleton className="h-14 w-full rounded-[16px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingCharges.length > 0 ? (
            <div className="mt-5 space-y-2.5">
              {upcomingCharges.slice(0, 4).map((series) => (
                <article
                  key={series.id}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{series.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {series.frequency} / {series.categoryName}
                      </p>
                    </div>
                    <Badge variant={series.status === 'upcoming' ? 'warning' : 'info'}>
                      {getDueLabel(series.dueInDays)}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Estimated amount
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {formatMoney(series.averageAmount)}
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Next charge
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {formatShortDate(series.nextCharge)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button asChild variant="soft">
                  <Link href="/transactions">Review transactions</Link>
                </Button>
              }
              className="mt-5 rounded-[24px] px-5 py-6"
              description="No upcoming recurring charges are predicted yet. Add a few repeated expenses and this view will start surfacing them."
              icon={CalendarClock}
              title="Nothing due soon"
            />
          )}

          <div className="mt-5 rounded-[22px] border border-brand/15 bg-brand/5 px-4 py-4">
            <p className="font-semibold text-ink">Detection notes</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Repeats are inferred from similar descriptions, timing gaps, and amount stability.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Recurring payments list</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Live recurring patterns
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Review cadence, confidence, next charge, and payment method in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{visibleSeries.length} visible</Badge>
              <Badge variant="info">{formatMoney(monthlyRecurringTotal)} monthly</Badge>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {isError ? (
              <div className="rounded-[22px] border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
                {errorMessage}
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                  >
                    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(240px,0.95fr),minmax(280px,1.15fr)] lg:items-center lg:gap-3">
                      <div className="flex items-center gap-3.5">
                        <Skeleton className="h-11 w-11 rounded-[16px]" />
                        <div className="min-w-0 flex-1">
                          <Skeleton className="h-4 w-36 rounded-full" />
                          <Skeleton className="mt-2 h-3 w-24 rounded-full" />
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3">
                        <Skeleton className="h-3 w-full rounded-full" />
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {Array.from({ length: 3 }).map((_, statIndex) => (
                            <Skeleton key={statIndex} className="h-10 w-full rounded-[14px]" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleSeries.length > 0 ? (
              visibleSeries.map((series) => (
                <article
                  key={series.id}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                >
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(240px,0.95fr),minmax(280px,1.15fr)] lg:items-center lg:gap-3">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand/10 text-brand">
                        <Repeat2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-semibold text-ink">{series.name}</p>
                          <Badge
                            variant={
                              series.status === 'paused'
                                ? 'neutral'
                                : series.status === 'upcoming'
                                  ? 'warning'
                                  : 'info'
                            }
                          >
                            {series.status === 'paused'
                              ? 'Paused or late'
                              : series.status === 'upcoming'
                                ? 'Upcoming'
                                : 'Renewing'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {series.frequency} / {series.categoryName}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3">
                      <ProgressBar
                        helper={formatConfidence(series.confidence)}
                        size="sm"
                        status={series.status === 'paused' ? 'warning' : 'brand'}
                        value={series.confidence * 100}
                      />
                    </div>
                  </div>

                  <div className="mt-3 border-t border-line/70 pt-3">
                    <div className="grid gap-2.5 lg:grid-cols-[132px,minmax(0,1fr),auto] lg:items-start">
                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Next charge
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">
                          {formatShortDate(series.nextCharge)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getDueLabel(series.dueInDays)}
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Estimate
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {formatMoney(series.averageAmount)}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Method
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <p className="text-sm font-medium text-ink">
                              {paymentMethodLabels[series.paymentMethod]}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            History
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {series.transactionCount} charges
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Last seen {formatShortDate(series.lastCharge)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button asChild size="sm" variant="soft">
                          <Link href="/transactions">Review source</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                action={
                  <Button asChild variant="soft">
                    <Link href="/transactions">Open transactions</Link>
                  </Button>
                }
                className="rounded-[24px] px-5 py-6"
                description={
                  searchValue || statusFilter !== 'all'
                    ? 'Try clearing the search or status filter to see more detected patterns.'
                    : 'No recurring patterns are confirmed yet. A few repeated expenses with similar timing will unlock this view.'
                }
                icon={Repeat2}
                title={
                  searchValue || statusFilter !== 'all'
                    ? 'No recurring charges match this view'
                    : 'No recurring charges detected'
                }
              />
            )}
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
        <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">Detection insights</p>
            <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
              What the pattern scan found
            </h2>
          </div>
          <Sparkles className="h-5 w-5 text-brand" />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {insights.map((insight) => (
            <article
              key={insight}
              className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand" />
                <p className="text-sm leading-6 text-slate-700">{insight}</p>
              </div>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
