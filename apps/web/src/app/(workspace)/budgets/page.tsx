import { ShieldAlert, Target, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { budgets, summaryMetrics } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

export default function BudgetsPage() {
  const remainingBudgetMetric =
    summaryMetrics[1] ??
    ({ label: 'Remaining budget', value: 0, delta: 0, helper: 'No data yet' } as const);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">View alerts</Button>
            <Button variant="secondary">Create budget</Button>
          </>
        }
        description="Budgets should feel motivating rather than punitive. Make pacing visible, show what remains, and surface warning states before they become stressful."
        eyebrow="Budgets"
        meta={
          <>
            <Badge variant="success">Safe, warning, and exceeded states</Badge>
            <Badge variant="neutral">Monthly and category-based limits</Badge>
          </>
        }
        title="Set spending limits and stay ahead of pressure."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          delta="+12%"
          helper="Still available this month"
          icon={Target}
          label="Remaining budget"
          value={formatMoney(remainingBudgetMetric.value)}
        />
        <MetricCard
          delta="-9%"
          helper="Needs review this month"
          icon={ShieldAlert}
          label="Categories at risk"
          value="2"
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Category budget cards</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Progress bars should answer budget health in seconds
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                  className="rounded-[26px] border border-white/80 bg-white/80 px-5 py-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{budget.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{budget.cadence}</p>
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

                  <div className="mt-5 space-y-3">
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

        <div className="space-y-6">
          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <p className="kicker">Create budget</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">
              Simple form with clear defaults
            </h2>

            <div className="mt-6 space-y-4">
              <Input placeholder="Budget name or category" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="$600" />
                <Input placeholder="Monthly" />
              </div>
              <Button variant="secondary">Save budget</Button>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <p className="kicker">Alert patterns</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] border border-warning/30 bg-warning/10 px-5 py-5">
                <p className="font-semibold text-ink">Near-limit warning</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Food and dining has only {formatMoney(120)} remaining for the month.
                </p>
              </div>
              <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-5 py-5">
                <p className="font-semibold text-ink">Over-budget alert</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Shopping is currently {formatMoney(90)} over plan and should stand out clearly.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
