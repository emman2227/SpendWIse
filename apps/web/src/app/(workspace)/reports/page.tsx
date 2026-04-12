import {
  CalendarRange,
  Download,
  FileText,
  Printer,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';

import { CategoryComparisonChart, SpendingOverviewChart } from '@/components/charts/finance-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { budgets, reportBars, spendingTrend } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

const totalCurrent = reportBars.reduce((sum, item) => sum + item.current, 0);
const totalPrevious = reportBars.reduce((sum, item) => sum + item.previous, 0);
const topMover = [...reportBars].sort((a, b) => b.current - a.current)[0];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Export CSV</Button>
            <Button variant="secondary">Export PDF</Button>
          </>
        }
        description="Reports now focus on quicker comparison, clearer export actions, and a more compact monthly story users can review without wading through oversized panels."
        eyebrow="Reports and analytics"
        meta={
          <>
            <Badge variant="neutral">Date range controls</Badge>
            <Badge variant="info">Print-friendly summary</Badge>
          </>
        }
        title="Review spending performance and export a clean monthly story."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          delta="Current period"
          helper="Tracked across the visible report categories"
          icon={TrendingUp}
          label="Period spend"
          value={formatMoney(totalCurrent)}
        />
        <MetricCard
          delta="Previous period"
          helper="Used for category comparison"
          icon={FileText}
          label="Comparison baseline"
          tone="mint"
          value={formatMoney(totalPrevious)}
        />
        <MetricCard
          delta="Largest category"
          helper={`${topMover.label} leads the current period`}
          icon={CalendarRange}
          label="Top mover"
          value={topMover.label}
        />
      </section>

      <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto]">
            <div className="flex flex-wrap gap-3">
              <button className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand/30 hover:text-ink">
                <CalendarRange className="mr-2 inline h-4 w-4" />
                Mar 1 - Mar 31, 2026
              </button>
              {['All categories', 'All accounts', 'Monthly view'].map((item) => (
                <button
                  key={item}
                  className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand/30 hover:text-ink"
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="soft">
                <Printer className="h-4 w-4" />
                Print summary
              </Button>
              <Button variant="soft">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-brand/10 bg-[linear-gradient(140deg,rgba(15,123,113,0.08),rgba(255,255,255,0.92))] px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="kicker">Report snapshot</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">
                  The clearest reports tell the monthly story in one glance.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Filters, comparisons, budget performance, and printable summary cues now sit
                  closer together so the report feels easier to use and easier to export.
                </p>
              </div>
              <Button size="sm" variant="secondary">
                <SlidersHorizontal className="h-4 w-4" />
                Refine view
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Report mode
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">Monthly comparison</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Export state
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">Ready for print and PDF</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Review priority
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">Compare category shifts first</p>
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
                Current period versus previous period
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                A tighter comparison card makes changes easier to scan without turning the chart
                area into the whole page.
              </p>
            </div>
            <Badge variant="info">Current vs previous</Badge>
          </div>

          <div className="mt-5">
            <CategoryComparisonChart data={reportBars} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[30px] px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Trend analysis</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Monthly trajectory at a glance
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                The trend view stays visible, but with a tighter shell so it complements the rest of
                the report instead of overpowering it.
              </p>
            </div>
            <Badge variant="neutral">Budget overlay</Badge>
          </div>

          <div className="mt-5">
            <SpendingOverviewChart data={spendingTrend} />
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Budget performance</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Budget pacing inside the reporting view
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                These rows keep budget consumption readable without forcing users to leave the
                report.
              </p>
            </div>
            <Button variant="soft">View budget details</Button>
          </div>

          <div className="mt-5 space-y-2.5">
            {budgets.map((budget) => (
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
                      status={
                        budget.status === 'danger'
                          ? 'danger'
                          : budget.status === 'warning'
                            ? 'warning'
                            : 'safe'
                      }
                      value={(budget.spent / budget.limit) * 100}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2.5 border-t border-line/70 pt-3 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:gap-2.5">
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
                        Status
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
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Printable summary</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                A cleaner export-ready monthly story
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                The summary stays presentation-ready while fitting more naturally inside the report
                page.
              </p>
            </div>
            <Badge variant="info">Ready for PDF export</Badge>
          </div>

          <div className="mt-5 rounded-[26px] border border-white/80 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-brand">SpendWise</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Monthly summary</h2>
                <p className="mt-2 text-sm text-slate-500">March 2026 / Maya Tan</p>
              </div>
              <FileText className="h-5 w-5 text-brand" />
            </div>

            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
              {[
                ['Total spent', formatMoney(4380)],
                ['Remaining budget', formatMoney(1420)],
                ['Savings trend', '18%'],
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
              <p className="font-semibold text-ink">Executive summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dining stabilized, shopping exceeded plan because of workspace setup purchases, and
                forecasts suggest April should remain manageable if transport spend moderates.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
