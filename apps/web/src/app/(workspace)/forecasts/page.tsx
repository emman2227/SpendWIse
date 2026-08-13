'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleAlert, TrendingUp } from 'lucide-react';

import {
  CategoryComparisonChart,
  CategoryShareChart,
  ForecastProjectionChart,
} from '@/components/charts/finance-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import { forecastDetailsQueryKey, getForecastDetails } from '@/lib/analytics/client';
import { useCurrentUserQuery } from '@/lib/auth/client';
import { forecastTrend } from '@/lib/demo-data';
import { formatConfidence, formatMoney as baseFormatMoney } from '@/lib/formatters';

export default function ForecastsPage() {
  const { data: user } = useCurrentUserQuery();
  const { data: forecastData, isLoading } = useQuery({
    queryKey: forecastDetailsQueryKey,
    queryFn: getForecastDetails,
  });
  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'USD');

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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          delta={isLoading ? '-' : '+3%'}
          helper="Predicted total next month"
          icon={TrendingUp}
          label="Projected spend"
          value={isLoading ? '-' : formatMoney(forecastData?.metrics.predictedAmount ?? 0)}
        />
        <MetricCard
          delta={isLoading ? '-' : '76%'}
          helper="Model reliability"
          icon={TrendingUp}
          label="Forecast confidence"
          value={isLoading ? '-' : formatConfidence(forecastData?.metrics.confidence ?? 0)}
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

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
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
          <p className="kicker">Forecast composition</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Projected spend distribution by category
          </h2>
          <div className="mt-6">
            {isLoading ? (
              <div className="flex h-[250px] items-center justify-center">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ) : (
              <CategoryShareChart data={forecastData?.share || []} />
            )}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Category-level forecast</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Current spending compared to projected totals
          </h2>
          <div className="mt-6">
            {isLoading ? (
              <div className="flex h-[290px] items-center justify-center">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ) : (
              <CategoryComparisonChart data={forecastData?.comparisons || []} />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Risk indicators</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Areas needing attention</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-warning/25 bg-warning/10 px-5 py-5">
              <p className="font-semibold text-ink">Transport may finish above baseline</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                The forecast model sees a higher ride-share pace than usual in the middle of the
                month.
              </p>
            </div>
            <div className="rounded-[24px] border border-line bg-paper px-5 py-5">
              <p className="font-semibold text-ink">Recurring bills remain stable</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                High-confidence fixed costs keep the overall prediction grounded and easier to
                trust.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
