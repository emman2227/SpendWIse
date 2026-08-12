'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import { dashboardAnalyticsQueryKey, getDashboardAnalytics } from '@/lib/analytics/client';

export default function InsightsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: dashboardAnalyticsQueryKey,
    queryFn: getDashboardAnalytics,
  });

  const insights = analytics?.insights ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        description="Explore insights extracted directly from your spending to understand trends and budget feedback."
        eyebrow="AI insights"
        meta={<Badge variant="info">Beta</Badge>}
        title="Spending Insights"
      />

      <section className="space-y-6">
        <SurfaceCard className="rounded-[32px] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium text-ink">
              Do you have any questions about this board?
            </h2>
            <Button className="gap-2" variant="default">
              <Sparkles className="h-4 w-4" />
              Deep Dive
            </Button>
          </div>
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden rounded-[32px] px-0 py-0">
          <div className="grid grid-cols-[1.5fr,1fr,2.5fr] gap-4 border-b border-line bg-sage/10 px-8 py-4">
            <p className="text-xs font-semibold text-ink-soft">Topic</p>
            <p className="text-xs font-semibold text-ink-soft">Impact</p>
            <p className="text-xs font-semibold text-ink-soft">Details</p>
          </div>

          {isLoading ? (
            <div className="space-y-4 px-8 py-6">
              <Skeleton className="h-[80px] w-full rounded-2xl" />
              <Skeleton className="h-[80px] w-full rounded-2xl" />
              <Skeleton className="h-[80px] w-full rounded-2xl" />
            </div>
          ) : insights.length > 0 ? (
            <div className="divide-y divide-line">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="grid grid-cols-[1.5fr,1fr,2.5fr] items-start gap-4 px-8 py-6 hover:bg-sage/5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          insight.type === 'anomaly' ? 'bg-orange-500' : 'bg-brand'
                        }`}
                      />
                      <p className="font-semibold text-ink">{insight.title}</p>
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">
                      {insight.type === 'anomaly' ? 'Anomaly detected' : 'Summary observation'}
                    </p>
                  </div>

                  <div>
                    <Badge variant={insight.type === 'anomaly' ? 'warning' : 'info'}>
                      {insight.metadata?.evidence ?? 'Active'}
                    </Badge>
                  </div>

                  <div>
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed text-ink">
                        <span className="font-semibold">Observation:</span> {insight.message}
                      </p>
                      {insight.metadata?.reason && (
                        <p className="text-sm leading-relaxed text-ink-soft">
                          <span className="font-semibold text-ink">AI Reasoning:</span>{' '}
                          {insight.metadata.reason}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                      <p className="text-sm text-ink-soft">Do you have any questions about this?</p>
                      <Button className="h-8 gap-1.5 px-3 text-xs" variant="soft">
                        <Sparkles className="h-3 w-3" />
                        Deep Dive
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-8 py-10">
              <EmptyState
                className="rounded-2xl"
                description="The analytics engine needs more data to generate insights for you."
                icon={Sparkles}
                title="No insights generated"
              />
            </div>
          )}
        </SurfaceCard>
      </section>
    </div>
  );
}
