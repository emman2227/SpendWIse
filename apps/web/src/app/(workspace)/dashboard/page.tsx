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
        description="The dashboard is the product hub: high-signal metrics, budget pacing, recent activity, and AI insight summaries in one scannable layout."
        eyebrow="Dashboard"
        meta={
          <>
            <Badge variant="info">AI monitoring active</Badge>
            <Badge variant="neutral">Updated 10 minutes ago</Badge>
          </>
        }
        title="See how your money behaves, not just where it went."
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
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                Monthly spending versus budget
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">6-month view</Badge>
              <Badge variant="info">Forecast overlay</Badge>
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
              <h2 className="mt-3 text-2xl font-semibold text-ink">Where money is concentrating</h2>
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
        <SurfaceCard className="rounded-[32px] px-5 py-3 md:px-6 md:py-3.5">
          <div className="flex items-center justify-between gap-2.5">
            <div>
              <p className="kicker">Budget progress</p>
              <h2 className="mt-1 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Limits that stay visible and motivating
              </h2>
            </div>
            <Button asChild size="sm" variant="soft">
              <Link href="/budgets">Set budget</Link>
            </Button>
          </div>

          <div className="mt-3 space-y-1.5">
            {budgets.map((budget) => {
              const progress = (budget.spent / budget.limit) * 100;
              const status =
                budget.status === 'danger'
                  ? 'danger'
                  : budget.status === 'warning'
                    ? 'warning'
                    : 'safe';

              return (
                <div
                  key={budget.id}
                  className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{budget.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{budget.cadence} budget</p>
                    </div>
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
                  <div className="mt-2 space-y-1">
                    <ProgressBar
                      helper={`${formatMoney(budget.spent)} of ${formatMoney(budget.limit)}`}
                      status={status}
                      value={progress}
                    />
                    <p className="text-sm text-slate-500">
                      {budget.remaining >= 0
                        ? `${formatMoney(budget.remaining)} remaining`
                        : `${formatMoney(Math.abs(budget.remaining))} over budget`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-5 py-3 md:px-6 md:py-3.5">
          <div className="flex items-center justify-between gap-2.5">
            <div>
              <p className="kicker">AI insights</p>
              <h2 className="mt-1 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Helpful, concise, and explainable
              </h2>
            </div>
            <Button asChild size="sm" variant="soft">
              <Link href="/insights">View insights</Link>
            </Button>
          </div>

          <div className="mt-3 space-y-1.5">
            {insights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-2.5"
              >
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
                <h3 className="mt-1.5 text-base font-semibold leading-snug text-ink">
                  {insight.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{insight.summary}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section>
        <SurfaceCard className="rounded-[32px] px-6 py-4 md:px-7 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="kicker">Recent transactions</p>
              <h2 className="mt-2.5 text-2xl font-semibold text-ink">
                Latest activity at a glance
              </h2>
            </div>
            <Button asChild size="sm" variant="soft">
              <Link href="/transactions">View all</Link>
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {transactions.slice(0, 4).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-4 rounded-[24px] border border-white/80 bg-white/80 px-5 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">{transaction.merchant}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {transaction.category} / {formatShortDate(transaction.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{formatMoney(transaction.amount)}</p>
                  <p className="mt-1 text-sm text-slate-500">{transaction.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
