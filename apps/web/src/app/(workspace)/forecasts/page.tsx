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
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Forecast chart</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Observed spending versus projected month-end path
          </h2>
          <div className="mt-6">
            {isLoading ? (
              <div className="flex h-[280px] items-center justify-center">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ) : (
              <ForecastProjectionChart data={projectionData} />
            )}
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

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7 flex flex-col">
          <p className="kicker">Risk indicators</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Areas needing attention</h2>
          <div className="mt-6 space-y-4 flex-1">
            {isLoading ? (
              <Skeleton className="h-[100px] w-full rounded-2xl" />
            ) : risks.length === 0 ? (
              <div className="rounded-[24px] border border-line bg-paper px-5 py-5 h-full flex flex-col justify-center items-center text-center">
                <Info className="h-8 w-8 text-ink-soft/50 mb-2" />
                <p className="font-semibold text-ink">No elevated risks detected</p>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  Your spending is within safe bounds across all categories based on the current
                  forecast.
                </p>
              </div>
            ) : (
              risks.map((risk: ForecastRisk, i: number) => (
                <div
                  key={i}
                  className={`rounded-[24px] border px-5 py-5 ${
                    risk.riskLevel === 'high'
                      ? 'border-danger/25 bg-danger/10'
                      : risk.riskLevel === 'medium'
                        ? 'border-warning/25 bg-warning/10'
                        : 'border-info/25 bg-info/10'
                  }`}
                >
                  <p className="font-semibold text-ink capitalize">{risk.category} pressure</p>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{risk.explanation}</p>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
