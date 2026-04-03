import { CircleAlert, TrendingUp } from 'lucide-react';

import { ForecastProjectionChart } from '@/components/charts/finance-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { forecastCategories, forecastTrend } from '@/lib/demo-data';
import { formatConfidence, formatMoney } from '@/lib/formatters';

export default function ForecastsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Adjust assumptions</Button>
            <Button variant="secondary">Save forecast</Button>
          </>
        }
        description="Forecasts should feel informative and calm. Pair projections with confidence cues and specific explanations for category-level risk."
        eyebrow="Forecasting"
        meta={
          <>
            <Badge variant="info">Confidence cues visible</Badge>
            <Badge variant="neutral">Weekly and monthly projection</Badge>
          </>
        }
        title="Prepare for next month before spending pressure arrives."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          delta="+3%"
          helper="Predicted total next month"
          icon={TrendingUp}
          label="Projected spend"
          value={formatMoney(4510)}
        />
        <MetricCard
          delta="76%"
          helper="Model reliability"
          icon={TrendingUp}
          label="Forecast confidence"
          value={formatConfidence(0.76)}
        />
        <MetricCard
          delta="2 risks"
          helper="Needs closer planning"
          icon={CircleAlert}
          label="Potential pressure"
          tone="mint"
          value="Transport, Shopping"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Forecast chart</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Observed spending versus projected month-end path
          </h2>
          <div className="mt-6">
            <ForecastProjectionChart data={forecastTrend} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">What to expect next month</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Calm summary with clear confidence language
          </h2>
          <div className="mt-5 rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
            <p className="text-lg font-semibold text-ink">
              Next month is likely to stay manageable.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Fixed costs are stable, dining looks more controlled, and the main watch area is
              transport. Use this summary at the top so users can orient quickly before reading the
              category details.
            </p>
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Category-level forecast</p>
          <div className="mt-5 space-y-4">
            {forecastCategories.map((item) => (
              <div
                key={item.name}
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{item.name}</p>
                  <Badge variant="info">{formatConfidence(item.confidence)}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Predicted {formatMoney(item.projected)}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Risk indicators</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] border border-warning/25 bg-warning/10 px-5 py-5">
              <p className="font-semibold text-ink">Transport may finish above baseline</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The forecast model sees a higher ride-share pace than usual in the middle of the
                month.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
              <p className="font-semibold text-ink">Recurring bills remain stable</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                High-confidence fixed costs keep the overall prediction grounded and easier to
                trust.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-sage/30 px-5 py-5">
              <p className="font-semibold text-ink">Design note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Risk cards should never feel like panic alerts. Keep the language informative,
                specific, and next-step oriented.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
