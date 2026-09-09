'use client';

import type { ForecastRisk } from '@spendwise/shared';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, Info, TrendingUp } from 'lucide-react';

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
import { formatConfidence, formatMoney as baseFormatMoney } from '@/lib/formatters';

export default function ForecastsPage() {
  const { data: user } = useCurrentUserQuery();
  const { data: forecastData, isLoading } = useQuery({
    queryKey: forecastDetailsQueryKey,
    queryFn: getForecastDetails,
  });
  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP');

  // Compute chart data dynamically
  const projectionData = forecastData?.forecastData
    ? [
        {
          label: 'Current',
          spend: forecastData.forecastData.currentSpend,
          forecast: forecastData.forecastData.currentSpend,
          range: [
            forecastData.forecastData.currentSpend,
            forecastData.forecastData.currentSpend,
          ] as [number, number],
        },
        {
          label: 'End of Month',
          spend: undefined,
          forecast: forecastData.forecastData.predictedAmount,
          range: [forecastData.forecastData.lowerBound, forecastData.forecastData.upperBound] as [
            number,
            number,
          ],
        },
      ]
    : [];

  const risks = forecastData?.forecastData?.risks || [];

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
          delta={isLoading ? '-' : ''}
          helper="Predicted total next month"
          icon={TrendingUp}
          label="Projected spend"
          value={isLoading ? '-' : formatMoney(forecastData?.metrics.predictedAmount ?? 0)}
        />
        <MetricCard
          delta={isLoading ? '-' : ''}
          helper={forecastData?.forecastData?.confidenceExplanation || 'Model reliability'}
          icon={TrendingUp}
          label="Forecast confidence"
          value={isLoading ? '-' : formatConfidence(forecastData?.metrics.confidence ?? 0)}
        />
        <MetricCard
          delta={isLoading ? '-' : `${risks.length} risks`}
          helper="Needs closer planning"
          icon={CircleAlert}
          label="Potential pressure"
          tone={risks.length > 0 ? 'default' : 'mint'}
          value={risks.length > 0 ? risks.map((r) => r.category).join(', ') : 'None'}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <p className="kicker">Forecast chart</p>
          <h2 className="mt-2 text-xl font-semibold text-ink sm:mt-3 sm:text-2xl">
            Observed spending versus projected month-end path
          </h2>
          <div className="mt-5 sm:mt-6">
            {isLoading ? (
              <div className="flex h-[240px] items-center justify-center sm:h-[280px]">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ) : (
              <ForecastProjectionChart data={projectionData} />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <p className="kicker">Forecast composition</p>
          <h2 className="mt-2 text-xl font-semibold text-ink sm:mt-3 sm:text-2xl">
            Projected spend distribution by category
          </h2>
          <div className="mt-5 sm:mt-6">
            {isLoading ? (
              <div className="flex h-[220px] items-center justify-center sm:h-[250px]">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ) : (
              <CategoryShareChart data={forecastData?.share || []} />
            )}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <p className="kicker">Category-level forecast</p>
          <h2 className="mt-2 text-xl font-semibold text-ink sm:mt-3 sm:text-2xl">
            Current spending compared to projected totals
          </h2>
          <div className="mt-5 sm:mt-6">
            {isLoading ? (
              <div className="flex h-[240px] items-center justify-center sm:h-[290px]">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ) : (
              <CategoryComparisonChart data={forecastData?.comparisons || []} />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="flex flex-col rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <p className="kicker">Risk indicators</p>
          <h2 className="mt-2 text-xl font-semibold text-ink sm:mt-3 sm:text-2xl">
            Areas needing attention
          </h2>
          <div className="mt-5 flex-1 space-y-3 sm:mt-6 sm:space-y-4">
            {isLoading ? (
              <Skeleton className="h-[100px] w-full rounded-2xl" />
            ) : risks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-[20px] border border-line bg-paper px-4 py-5 text-center sm:rounded-[24px] sm:px-5">
                <Info className="mb-2 h-8 w-8 text-ink-soft/50" />
                <p className="font-semibold text-ink">No elevated risks detected</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft sm:text-sm sm:leading-6">
                  Your spending is within safe bounds across all categories based on the current
                  forecast.
                </p>
              </div>
            ) : (
              risks.map((risk: ForecastRisk, i: number) => (
                <div
                  key={i}
                  className={`rounded-[20px] border px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5 ${
                    risk.riskLevel === 'high'
                      ? 'border-danger/25 bg-danger/10'
                      : risk.riskLevel === 'medium'
                        ? 'border-warning/25 bg-warning/10'
                        : 'border-info/25 bg-info/10'
                  }`}
                >
                  <p className="font-semibold capitalize text-ink">{risk.category} pressure</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:mt-2 sm:text-sm sm:leading-6">
                    {risk.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
