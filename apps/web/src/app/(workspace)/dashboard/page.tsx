import { formatShortDate } from '@spendwise/shared';
import { ArrowUpRight, PiggyBank, ReceiptText, Target, Wallet } from 'lucide-react';
import Link from 'next/link';

import { CategoryShareChart, SpendingOverviewChart } from '@/components/charts/finance-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  budgets,
  categoryShare,
  insights,
  spendingTrend,
  summaryMetrics,
  transactions,
} from '@/lib/demo-data';
import { formatDelta, formatMoney } from '@/lib/formatters';

const metricIcons = [Wallet, Target, ReceiptText, PiggyBank];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button asChild variant="soft">
              <Link href="/reports">Export report</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/transactions">Add expense</Link>
            </Button>
          </>
        }
        description="Your key numbers in one view."
        eyebrow="Dashboard"
        meta={
          <>
            <Badge variant="info">AI active</Badge>
            <Badge variant="neutral">Updated 10m</Badge>
          </>
        }
        title="See what needs attention."
      />

      <section className="grid gap-4 xl:grid-cols-4">
        {summaryMetrics.map((metric, index) => {
          const Icon = metricIcons[index];
          const displayValue =
            metric.label === 'Monthly transactions'
              ? metric.value.toString()
              : metric.label === 'Savings trend'
                ? `${metric.value}%`
                : formatMoney(metric.value);

          return (
            <MetricCard
              key={metric.label}
              delta={formatDelta(metric.delta)}
              helper={metric.helper}
              icon={Icon}
              label={metric.label}
              tone={index === 3 ? 'mint' : 'default'}
              value={displayValue}
            />
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Spending overview</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Spending vs budget</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">6 months</Badge>
              <Badge variant="info">Forecast</Badge>
            </div>
          </div>
          <div className="mt-6">
            <SpendingOverviewChart data={spendingTrend} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="kicker">Category mix</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Category mix</h2>
            </div>
            <ArrowUpRight className="h-5 w-5 text-brand" />
          </div>

          <div className="mt-4">
            <CategoryShareChart data={categoryShare} />
          </div>

          <div className="mt-3 space-y-3">
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
            {budgets.map((budget) => {
              const progress = (budget.spent / budget.limit) * 100;
              const status =
                budget.status === 'danger'
                  ? 'danger'
                  : budget.status === 'warning'
                    ? 'warning'
                    : 'safe';

              return (
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
                      <p className="mt-1 text-sm text-slate-500">{budget.cadence} budget</p>
                    </div>

                    <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3">
                      <ProgressBar
                        helper={`${formatMoney(budget.spent)} of ${formatMoney(budget.limit)}`}
                        size="sm"
                        status={status}
                        value={progress}
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
              );
            })}
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
            <Button asChild size="sm" variant="soft">
              <Link href="/insights">View insights</Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-2.5">
            {insights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge
                    variant={
                      insight.tone === 'success'
                        ? 'success'
                        : insight.tone === 'warning'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {insight.label}
                  </Badge>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
                <h3 className="mt-2 text-base font-semibold leading-snug text-ink">
                  {insight.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{insight.summary}</p>
              </article>
            ))}
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
            {transactions.slice(0, 4).map((transaction) => (
              <article
                key={transaction.id}
                className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{transaction.merchant}</p>
                      <Badge variant={transaction.alert ? 'warning' : 'neutral'}>
                        {transaction.category}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatShortDate(transaction.date)} / {transaction.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">{formatMoney(transaction.amount)}</p>
                    <p className="mt-1 text-sm text-slate-500">{transaction.note}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
