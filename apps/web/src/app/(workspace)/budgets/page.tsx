'use client';

import {
  CircleAlert,
  CircleX,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { budgets, summaryMetrics } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

const budgetPresets = ['Groceries', 'Dining out', 'Bills', 'Transport'];

const budgetTone: Record<string, string> = {
  'Food and dining': 'bg-emerald/10 text-emerald',
  Transport: 'bg-sky-100 text-sky-700',
  Shopping: 'bg-amber-100 text-amber-700',
  'Home and utilities': 'bg-slate-100 text-slate-700',
};

export default function BudgetsPage() {
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);

  const remainingBudgetMetric =
    summaryMetrics[1] ??
    ({ label: 'Remaining budget', value: 0, delta: 0, helper: 'No data yet' } as const);

  const totalBudgeted = budgets.reduce((total, budget) => total + budget.limit, 0);
  const totalSpent = budgets.reduce((total, budget) => total + budget.spent, 0);
  const atRiskCount = budgets.filter((budget) => budget.status !== 'safe').length;
  const safeCount = budgets.filter((budget) => budget.status === 'safe').length;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button variant="soft">View alerts</Button>
              <Button onClick={() => setIsCreateBudgetOpen(true)} variant="secondary">
                Create budget
              </Button>
            </>
          }
          description="The budgets workspace is redesigned to answer the questions users actually have: what is safe, what is close to slipping, and what should be adjusted next."
          eyebrow="Budgets"
          meta={
            <>
              <Badge variant="success">On-track and at-risk states</Badge>
              <Badge variant="neutral">Cleaner review flow</Badge>
            </>
          }
          title="Stay ahead of spending pressure with clearer budget pacing."
        />

        <section className="grid gap-4 xl:grid-cols-3">
          <MetricCard
            delta={`+${remainingBudgetMetric.delta}%`}
            helper="Still available this month"
            icon={Target}
            label="Remaining budget"
            value={formatMoney(remainingBudgetMetric.value)}
          />
          <MetricCard
            delta={`${atRiskCount} need attention`}
            helper={`${safeCount} categories are currently on track`}
            icon={ShieldAlert}
            label="Categories at risk"
            value={atRiskCount.toString()}
          />
          <MetricCard
            delta="+4%"
            helper="Projected savings lift"
            icon={TrendingUp}
            label="End-of-month outlook"
            tone="mint"
            value="Positive"
          />
        </section>

        <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="kicker">Budget snapshot</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">
                  Your budget health is strongest when the next action is obvious.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This view keeps totals, risk, and pacing in one place so users can review budgets
                  quickly without jumping between cards.
                </p>
              </div>
              <Button onClick={() => setIsCreateBudgetOpen(true)} size="sm" variant="secondary">
                <Plus className="h-4 w-4" />
                Add budget
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Total budgeted
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink">{formatMoney(totalBudgeted)}</p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Total spent
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink">{formatMoney(totalSpent)}</p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Next priority
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {atRiskCount ? 'Review at-risk budgets' : 'All budgets are steady'}
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Budget list</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Review every budget in one calm, compact pass
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Each row keeps the category name, progress, remaining amount, and state aligned so
                the user can judge budget health in seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Monthly pacing</Badge>
              <Badge variant="info">Horizontal rows</Badge>
              <Button onClick={() => setIsCreateBudgetOpen(true)} variant="secondary">
                Create budget
              </Button>
              <Button variant="soft">
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {budgets.map((budget) => {
              const progress = (budget.spent / budget.limit) * 100;
              const status =
                budget.status === 'danger'
                  ? 'danger'
                  : budget.status === 'warning'
                    ? 'warning'
                    : 'safe';
              const toneClass = budgetTone[budget.name] ?? 'bg-slate-100 text-slate-700';

              return (
                <article
                  key={budget.id}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                >
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(220px,0.95fr),minmax(280px,1.15fr)] lg:items-center lg:gap-3">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-sm font-semibold ${toneClass}`}
                      >
                        {budget.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-ink">{budget.name}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
                          <p className="text-sm text-slate-500">{budget.cadence} budget</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3 lg:min-w-0">
                      <ProgressBar
                        helper={`${formatMoney(budget.spent)} of ${formatMoney(budget.limit)}`}
                        size="sm"
                        status={status}
                        value={progress}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2.5 border-t border-line/70 pt-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center lg:gap-2.5">
                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Remaining
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
                            ? 'Above plan'
                            : budget.status === 'warning'
                              ? 'Watch closely'
                              : 'Healthy'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                        type="button"
                      >
                        Adjust
                      </button>
                      <button
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                        type="button"
                      >
                        Pause
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-warning/25 bg-warning/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 text-warning" />
                <div>
                  <p className="font-semibold text-ink">Near-limit reminder</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Food and dining has only {formatMoney(120)} left this month, so it should stay
                    visible in review.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-danger" />
                <div>
                  <p className="font-semibold text-ink">Over-budget alert</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Shopping is already {formatMoney(90)} over plan and should be the first category
                    to adjust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {isCreateBudgetOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,38,63,0.42)] px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="panel-surface-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] px-5 py-5 md:px-7 md:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kicker">Create budget</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">
                  Add a budget without losing your place
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Keep setup lightweight so users can create or adjust a limit and go straight back
                  to review.
                </p>
              </div>
              <button
                aria-label="Close create budget modal"
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
                onClick={() => setIsCreateBudgetOpen(false)}
                type="button"
              >
                <CircleX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {budgetPresets.map((preset) => (
                <button
                  key={preset}
                  className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                  type="button"
                >
                  {preset}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4">
              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Budget name or category</span>
                <Input placeholder="Food and dining" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Limit amount</span>
                  <Input placeholder="$600" />
                </label>
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Cadence</span>
                  <Input placeholder="Monthly" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Starts on</span>
                  <Input placeholder="Apr 1, 2026" />
                </label>
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Alert threshold</span>
                  <Input placeholder="80%" />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary">
                  Save budget
                </Button>
                <Button onClick={() => setIsCreateBudgetOpen(false)} type="button" variant="soft">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
