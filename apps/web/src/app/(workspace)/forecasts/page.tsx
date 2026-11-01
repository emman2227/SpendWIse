'use client';

import type { ForecastRisk } from '@spendwise/shared';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, Info, RotateCcw, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { cn } from '@/lib/utils';

export default function ForecastsPage() {
  const { data: user } = useCurrentUserQuery();
  const [reductions, setReductions] = useState<Record<string, number>>({});

  const { data: forecastData, isLoading } = useQuery({
    queryKey: forecastDetailsQueryKey,
    queryFn: getForecastDetails,
  });

  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP');

  const comparisons = useMemo(() => forecastData?.comparisons || [], [forecastData]);

  // Total simulated monthly savings based on active slider adjustments
  const totalSimulatedSavings = useMemo(() => {
    return comparisons.reduce((sum, item) => {
      const reductionPercent = reductions[item.label] || 0;
      return sum + (item.projected * reductionPercent) / 100;
    }, 0);
  }, [comparisons, reductions]);

  const hasActiveSimulation = totalSimulatedSavings > 0;

  // Adjusted predicted amount accounting for scenario reductions
  const originalPredicted = forecastData?.metrics.predictedAmount ?? 0;
  const simulatedPredicted = Math.max(0, originalPredicted - totalSimulatedSavings);

  // Simulated category comparison bars reflecting slider adjustments
  const simulatedComparisons = useMemo(() => {
    return comparisons.map((item) => {
      const reductionPercent = reductions[item.label] || 0;
      const adjustedProjected = Math.max(
        item.current,
        item.projected * (1 - reductionPercent / 100),
      );
      return {
        ...item,
        projected: Math.round(adjustedProjected),
      };
    });
  }, [comparisons, reductions]);

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
          forecast: hasActiveSimulation
            ? simulatedPredicted
            : forecastData.forecastData.predictedAmount,
          range: [
            Math.max(0, forecastData.forecastData.lowerBound - totalSimulatedSavings),
            Math.max(0, forecastData.forecastData.upperBound - totalSimulatedSavings),
          ] as [number, number],
        },
      ]
    : [];

  const risks = forecastData?.forecastData?.risks || [];

  const handleSliderChange = (categoryLabel: string, percent: number) => {
    setReductions((prev) => ({
      ...prev,
      [categoryLabel]: percent,
    }));
  };

  const handleResetSimulation = () => {
    setReductions({});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          hasActiveSimulation ? (
            <Button onClick={handleResetSimulation} variant="soft" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset scenario
            </Button>
          ) : undefined
        }
        description="Forecasts pair historical category velocity with confidence indicators and interactive scenario simulation."
        eyebrow="Financial Intelligence"
        meta={
          <>
            <Badge variant="info">Continuous Telemetry</Badge>
            <Badge variant="neutral">Monthly projection</Badge>
            {hasActiveSimulation && <Badge variant="success">Scenario Simulation Active</Badge>}
          </>
        }
        title="Prepare for next month before spending pressure arrives."
      />

      {/* Metric Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          delta={
            hasActiveSimulation ? `Save ${formatMoney(totalSimulatedSavings)}` : 'Baseline model'
          }
          helper={
            hasActiveSimulation
              ? `Adjusted from ${formatMoney(originalPredicted)}`
              : 'Predicted total next month'
          }
          icon={TrendingUp}
          label={hasActiveSimulation ? 'Simulated projection' : 'Projected spend'}
          tone={hasActiveSimulation ? 'mint' : 'default'}
          value={isLoading ? '-' : formatMoney(simulatedPredicted)}
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

      {/* Interactive Scenario Planning Simulator */}
      {comparisons.length > 0 ? (
        <SurfaceCard className="rounded-[28px] p-5 sm:rounded-[32px] sm:p-6 md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/70 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="kicker">Interactive simulation</p>
                <Sparkles className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
                Scenario Planning & What-If Simulator
              </h2>
              <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
                Adjust reduction targets on high-spend categories to simulate potential monthly
                savings.
              </p>
            </div>

            {hasActiveSimulation && (
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-right">
                  <span className="text-[11px] font-medium text-ink-soft block">
                    Simulated Monthly Savings:
                  </span>
                  <span className="text-sm font-bold text-brand">
                    +{formatMoney(totalSimulatedSavings)}
                  </span>
                </div>
                <Button
                  onClick={handleResetSimulation}
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-xs text-ink-soft hover:text-ink"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              </div>
            )}
          </div>

          <div
            className={cn(
              'mt-6 grid gap-5',
              comparisons.length === 1 && 'grid-cols-1 max-w-lg',
              comparisons.length === 2 && 'grid-cols-1 md:grid-cols-2',
              comparisons.length >= 3 && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
            )}
          >
            {comparisons.map((cat) => {
              const currentReduction = reductions[cat.label] || 0;
              const savings = (cat.projected * currentReduction) / 100;
              const adjustedProjected = cat.projected - savings;

              return (
                <div
                  key={cat.label}
                  className={cn(
                    'rounded-2xl border p-4 transition-all',
                    currentReduction > 0
                      ? 'border-brand/40 bg-brand/5 shadow-xs'
                      : 'border-line bg-paper hover:border-line/80',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink text-sm truncate max-w-[240px] sm:max-w-[320px]">
                      {cat.label}
                    </span>
                    <Badge
                      variant={currentReduction > 0 ? 'success' : 'neutral'}
                      className="text-xs font-semibold px-2 py-0.5"
                    >
                      {currentReduction > 0 ? `-${currentReduction}%` : 'Current pace'}
                    </Badge>
                  </div>

                  <div className="mt-2.5 flex items-baseline justify-between text-xs text-ink-soft">
                    <span>
                      Pacing: <strong className="text-ink">{formatMoney(cat.projected)}</strong>
                    </span>
                    {currentReduction > 0 && (
                      <span className="text-brand font-medium">
                        Target: {formatMoney(adjustedProjected)}
                      </span>
                    )}
                  </div>

                  {/* Slider Control */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-ink-soft">
                      <span>Reduce spend</span>
                      <span className="font-semibold text-ink">{currentReduction}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={currentReduction}
                      onChange={(e) => handleSliderChange(cat.label, parseInt(e.target.value, 10))}
                      className="w-full accent-brand cursor-pointer h-1.5 rounded-lg bg-line/60"
                      aria-label={`Reduce ${cat.label} spending by percentage`}
                    />
                  </div>

                  {currentReduction > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-brand/20 flex items-center justify-between text-xs">
                      <span className="text-ink-soft">Simulated saving:</span>
                      <span className="font-bold text-brand">+{formatMoney(savings)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      ) : !isLoading ? (
        <SurfaceCard className="rounded-[28px] p-5 sm:rounded-[32px] sm:p-6 md:p-7 text-center">
          <div className="flex flex-col items-center justify-center py-6">
            <Sparkles className="h-8 w-8 text-brand/50 mb-2" />
            <h3 className="text-lg font-semibold text-ink">
              Scenario Planning & What-If Simulator
            </h3>
            <p className="mt-1 text-sm text-ink-soft max-w-md">
              Add expense categories or record spending to unlock interactive scenario simulation
              and test monthly savings targets.
            </p>
          </div>
        </SurfaceCard>
      ) : null}

      {/* Forecast Chart & Composition Sections */}
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

      {/* Category-Level Comparisons & Risks */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="kicker">Category-level forecast</p>
              <h2 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
                Current spending compared to projected totals
              </h2>
            </div>
            {hasActiveSimulation && (
              <Badge variant="info" className="text-xs">
                Reflecting scenario targets
              </Badge>
            )}
          </div>
          <div className="mt-5 sm:mt-6">
            {isLoading ? (
              <div className="flex h-[240px] items-center justify-center sm:h-[290px]">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ) : (
              <CategoryComparisonChart data={simulatedComparisons} />
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
