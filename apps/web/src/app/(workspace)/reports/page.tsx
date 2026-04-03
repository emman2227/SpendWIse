import { CalendarRange, Download, Printer } from 'lucide-react';

import { CategoryComparisonChart, SpendingOverviewChart } from '@/components/charts/finance-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { budgets, reportBars, spendingTrend } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

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
        description="Reports and analytics should prioritize clarity over decoration: strong filters, clean comparisons, printable layouts, and visible export actions."
        eyebrow="Reports and analytics"
        meta={
          <>
            <Badge variant="neutral">Date range controls</Badge>
            <Badge variant="info">Print-friendly summary</Badge>
          </>
        }
        title="Review spending performance and export a clean monthly story."
      />

      <SurfaceCard className="rounded-[30px] px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <button className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600">
              <CalendarRange className="mr-2 inline h-4 w-4" />
              Mar 1 - Mar 31, 2026
            </button>
            {['All categories', 'All accounts', 'Monthly view'].map((item) => (
              <button
                key={item}
                className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600"
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
      </SurfaceCard>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Category comparison</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Current period versus previous period
          </h2>
          <div className="mt-6">
            <CategoryComparisonChart data={reportBars} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Trend analysis</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Monthly trajectory at a glance</h2>
          <div className="mt-6">
            <SpendingOverviewChart data={spendingTrend} />
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Budget performance</p>
          <div className="mt-5 space-y-4">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{budget.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatMoney(budget.spent)} / {formatMoney(budget.limit)}
                  </p>
                </div>
                <div className="mt-4">
                  <ProgressBar
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
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Printable summary layout</p>
          <div className="mt-5 rounded-[28px] border border-white/80 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-brand">SpendWise</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Monthly summary</h2>
                <p className="mt-2 text-sm text-slate-500">March 2026 / Maya Tan</p>
              </div>
              <Badge variant="info">Ready for PDF export</Badge>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ['Total spent', formatMoney(4380)],
                ['Remaining budget', formatMoney(1420)],
                ['Savings trend', '18%'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] bg-sage/30 px-4 py-4">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/80 bg-slate-50 px-5 py-5">
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
