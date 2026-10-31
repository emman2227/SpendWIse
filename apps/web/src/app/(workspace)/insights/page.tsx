'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CircleAlert,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  dashboardAnalyticsQueryKey,
  generateAnalytics,
  getInsights,
  insightsQueryKey,
} from '@/lib/analytics/client';
import {
  listTransactionCategories,
  transactionCategoriesQueryKey,
} from '@/lib/transactions/client';
import { cn } from '@/lib/utils';

type TypeFilter = 'all' | 'anomaly' | 'budget' | 'trend' | 'opportunity';
const PAGE_SIZE = 6;

export default function InsightsPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: insightsQueryKey,
    queryFn: getInsights,
  });

  const categoriesQuery = useQuery({
    queryKey: transactionCategoriesQueryKey,
    queryFn: listTransactionCategories,
  });

  const generateMutation = useMutation({
    mutationFn: generateAnalytics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightsQueryKey });
      queryClient.invalidateQueries({ queryKey: dashboardAnalyticsQueryKey });
    },
  });

  // Consolidated list of categories for filter buttons
  const availableCategories = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();

    (categoriesQuery.data ?? []).forEach((c) => {
      if (!seen.has(c.name.toLowerCase())) {
        seen.add(c.name.toLowerCase());
        list.push({ id: c.id, name: c.name });
      }
    });

    insights.forEach((i) => {
      if (i.category && !seen.has(i.category.toLowerCase())) {
        seen.add(i.category.toLowerCase());
        list.push({ id: i.category, name: i.category });
      }
    });

    return list;
  }, [categoriesQuery.data, insights]);

  // Executive Metric Counts
  const metrics = useMemo(() => {
    const total = insights.length;
    const criticalOrWarning = insights.filter(
      (i) => i.severity === 'critical' || i.severity === 'warning',
    ).length;
    const opportunities = insights.filter(
      (i) => i.type === 'positive' || i.type === 'recommendation',
    ).length;

    return { total, criticalOrWarning, opportunities };
  }, [insights]);

  // Signal type tab counts
  const tabCounts = useMemo(() => {
    return {
      all: insights.length,
      anomaly: insights.filter((i) => i.type === 'anomaly').length,
      budget: insights.filter((i) => i.type === 'budget').length,
      trend: insights.filter((i) => i.type === 'trend').length,
      opportunity: insights.filter((i) => i.type === 'positive' || i.type === 'recommendation')
        .length,
    };
  }, [insights]);

  const filterTabs = [
    { id: 'all' as const, label: 'All Signals', count: tabCounts.all },
    { id: 'anomaly' as const, label: 'Anomalies & Spikes', count: tabCounts.anomaly },
    { id: 'budget' as const, label: 'Budget Risks', count: tabCounts.budget },
    { id: 'trend' as const, label: 'Trends', count: tabCounts.trend },
    { id: 'opportunity' as const, label: 'Opportunities', count: tabCounts.opportunity },
  ];

  // Filtering Logic
  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      // Search filter
      if (searchValue.trim()) {
        const query = searchValue.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesMessage = item.message?.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);
        const matchesReason = item.reason?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMessage && !matchesCategory && !matchesReason) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all') {
        if (!item.category || item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'anomaly' && item.type !== 'anomaly') return false;
        if (typeFilter === 'budget' && item.type !== 'budget') return false;
        if (typeFilter === 'trend' && item.type !== 'trend') return false;
        if (
          typeFilter === 'opportunity' &&
          item.type !== 'positive' &&
          item.type !== 'recommendation'
        )
          return false;
      }

      return true;
    });
  }, [insights, searchValue, categoryFilter, typeFilter]);

  const isFiltered = Boolean(searchValue || typeFilter !== 'all' || categoryFilter !== 'all');

  const handleResetFilters = () => {
    setSearchValue('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  // Pagination calculations (retained pagination)
  const totalItems = filteredInsights.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentValidPage = Math.min(currentPage, totalPages);
  const paginatedInsights = useMemo(() => {
    const startIndex = (currentValidPage - 1) * PAGE_SIZE;
    return filteredInsights.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredInsights, currentValidPage]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header matching Transactions & Workspace pages */}
      <PageHeader
        actions={
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            variant="secondary"
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', generateMutation.isPending && 'animate-spin')} />
            {generateMutation.isPending ? 'Analyzing telemetry...' : 'Refresh insights'}
          </Button>
        }
        description="Actionable intelligence on spending spikes, budget utilization, and savings opportunities."
        eyebrow="Financial Intelligence"
        meta={
          <>
            <Badge variant="info">AI Powered</Badge>
            <Badge variant="neutral">
              {isLoading ? 'Syncing...' : `${insights.length} total signals`}
            </Badge>
            {isFiltered && <Badge variant="warning">{totalItems} filtered</Badge>}
          </>
        }
        title="Spending Insights"
      />

      {/* 2. Executive Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          delta={`${metrics.total} active signals`}
          helper="Continuous financial telemetry"
          icon={Sparkles}
          label="Total signals"
          value={metrics.total.toString()}
        />
        <MetricCard
          delta={
            metrics.criticalOrWarning > 0
              ? `${metrics.criticalOrWarning} need review`
              : 'All budgets healthy'
          }
          helper="Velocity and variance indicators"
          icon={CircleAlert}
          label="Attention required"
          tone={metrics.criticalOrWarning > 0 ? 'default' : 'mint'}
          value={metrics.criticalOrWarning.toString()}
        />
        <MetricCard
          delta={metrics.opportunities > 0 ? `${metrics.opportunities} targets` : 'No targets'}
          helper="Opportunities to accelerate goals"
          icon={TrendingUp}
          label="Optimization potential"
          tone="mint"
          value={metrics.opportunities.toString()}
        />
      </section>

      {/* 3. Filter Bar with Simple Buttons (No Dropdowns) */}
      <SurfaceCard className="rounded-[28px] p-4 sm:p-5">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Signal Type Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => {
              const isActive = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTypeFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer',
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-paper-strong text-ink-soft hover:border-brand/40 hover:text-ink',
                  )}
                  type="button"
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold transition',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-paper text-ink-soft border border-line/60',
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input with Clear Button */}
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              className="h-10 rounded-full pl-10 pr-9 text-xs sm:text-sm"
              onChange={(e) => {
                setSearchValue(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search signals, reasons..."
              value={searchValue}
            />
            {searchValue ? (
              <button
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition hover:text-ink cursor-pointer"
                onClick={() => setSearchValue('')}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Category Pills Row */}
        {availableCategories.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                <Filter className="h-3 w-3 text-brand" />
                Category:
              </span>
              <button
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer',
                  categoryFilter === 'all'
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-paper-strong text-ink-soft hover:border-brand/30 hover:text-ink',
                )}
                onClick={() => {
                  setCategoryFilter('all');
                  setCurrentPage(1);
                }}
                type="button"
              >
                All
              </button>
              {availableCategories.map((cat) => {
                const isSelected = categoryFilter.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.id || cat.name}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer',
                      isSelected
                        ? 'bg-brand text-white shadow-sm'
                        : 'border border-line bg-paper-strong text-ink-soft hover:border-brand/30 hover:text-ink',
                    )}
                    onClick={() => {
                      setCategoryFilter(isSelected ? 'all' : cat.name);
                      setCurrentPage(1);
                    }}
                    type="button"
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {isFiltered && (
              <button
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition hover:text-brand cursor-pointer"
                onClick={handleResetFilters}
                type="button"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filters
              </button>
            )}
          </div>
        )}
      </SurfaceCard>

      {/* 4. Main Insights Feed Container with Retained Pagination */}
      <SurfaceCard className="rounded-[28px] p-4 md:p-5">
        <div className="space-y-4">
          {/* Header Bar inside Card */}
          <div className="flex flex-col gap-3 border-b border-line/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="kicker">Intelligence feed</p>
              <h2 className="mt-0.5 text-xl font-semibold leading-tight text-ink md:text-2xl">
                Active signals
              </h2>
              <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
                Review anomalies, telemetry explanations, and actionable next steps.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={isFiltered ? 'info' : 'neutral'}>
                {isFiltered ? `${totalItems} filtered` : `${totalItems} total`}
              </Badge>
            </div>
          </div>

          {/* Insight Cards Responsive Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-[220px] rounded-[22px] w-full" />
              <Skeleton className="h-[220px] rounded-[22px] w-full" />
            </div>
          ) : paginatedInsights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5 pt-1">
              {paginatedInsights.map((insight) => {
                const isCritical = insight.severity === 'critical';
                const isWarning = insight.severity === 'warning';

                return (
                  <article
                    key={insight.id}
                    className="flex flex-col justify-between rounded-[22px] border border-line bg-paper p-5 transition hover:border-brand/40 hover:shadow-soft"
                  >
                    <div className="space-y-3.5">
                      {/* Top meta row: Category, Type pill, Severity */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-ink">
                            {insight.category || 'General Spending'}
                          </span>
                          <span className="text-xs text-ink-soft capitalize">
                            {insight.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <Badge variant={isCritical ? 'danger' : isWarning ? 'warning' : 'info'}>
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                          {isCritical ? 'Critical' : isWarning ? 'Warning' : 'Opportunity'}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-ink leading-snug">{insight.title}</h3>

                      {/* Primary Message */}
                      <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                        {insight.message}
                      </p>

                      {/* Telemetry Reasoning callout */}
                      {insight.reason && (
                        <div className="rounded-[14px] bg-sage/10 px-3.5 py-2.5 text-xs text-ink border border-line/40">
                          <span className="font-semibold text-brand mr-1.5">✦ AI Reasoning:</span>
                          <span className="text-ink-soft">{insight.reason}</span>
                        </div>
                      )}

                      {/* Recommendation Callout */}
                      {insight.recommendation && (
                        <div className="rounded-[14px] bg-brand/5 border border-brand/20 px-3.5 py-2.5 text-xs text-brand font-medium">
                          <span className="font-semibold mr-1.5">💡 Next Step:</span>
                          <span>{insight.recommendation}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom: Deep Dive Action CTA */}
                    <div className="mt-4 pt-3.5 border-t border-line/50 flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-brand flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Telemetry
                      </span>
                      <Link href={`/insights/${insight.id}`}>
                        <Button
                          size="sm"
                          variant="soft"
                          className="rounded-full gap-1.5 px-3.5 h-8 text-xs hover:border-brand hover:text-brand"
                        >
                          <span>Deep dive</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState
                className="rounded-2xl"
                description={
                  isFiltered
                    ? 'No spending signals match your active filters. Try resetting your search or filters.'
                    : 'The analytics engine needs more data to generate insights for you.'
                }
                icon={Sparkles}
                title={isFiltered ? 'No matching signals' : 'No insights generated'}
              />
              {!isFiltered && (
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    variant="secondary"
                    className="gap-2"
                  >
                    <RefreshCw
                      className={cn('h-4 w-4', generateMutation.isPending && 'animate-spin')}
                    />
                    {generateMutation.isPending ? 'Generating...' : 'Run Analytics Engine'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 5. Retained Pagination (Always visible when insights exist) */}
          {totalItems > 0 && (
            <div className="pt-4 border-t border-line">
              <Pagination
                alwaysShow={true}
                currentPage={currentValidPage}
                itemLabel="signals"
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={totalItems}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
