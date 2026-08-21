'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import { getInsights, insightsQueryKey } from '@/lib/analytics/client';

export default function InsightsPage() {
  const [page, setPage] = useState(1);
  const { data: insights = [], isLoading } = useQuery({
    queryKey: insightsQueryKey,
    queryFn: getInsights,
  });

  const totalPages = Math.ceil(insights.length / 1) || 1;
  const currentValidPage = Math.min(page, totalPages);
  const currentInsights = insights.slice(currentValidPage - 1, currentValidPage);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Explore insights extracted directly from your spending to understand trends and budget feedback."
        eyebrow="AI insights"
        meta={<Badge variant="info">Beta</Badge>}
        title="Spending Insights"
      />

      <section className="space-y-6">
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
          ) : currentInsights.length > 0 ? (
            <div>
              <div className="divide-y divide-line">
                {currentInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="grid grid-cols-[1.5fr,1fr,2.5fr] items-start gap-4 px-8 py-6 hover:bg-sage/5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            insight.severity === 'critical'
                              ? 'bg-danger'
                              : insight.severity === 'warning'
                                ? 'bg-warning'
                                : 'bg-info'
                          }`}
                        />
                        <p className="font-semibold text-ink">{insight.title}</p>
                      </div>
                      <p className="mt-1.5 text-xs text-ink-soft capitalize">
                        {insight.type.replace('_', ' ')}
                      </p>
                    </div>

                    <div>
                      <Badge
                        variant={
                          insight.severity === 'critical'
                            ? 'danger'
                            : insight.severity === 'warning'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {insight.impact ? 'Monitored' : 'Active'}
                      </Badge>
                    </div>

                    <div>
                      <div className="space-y-2">
                        <p className="text-sm leading-relaxed text-ink">{insight.message}</p>
                        {insight.reason && (
                          <p className="text-sm leading-relaxed text-ink-soft">
                            <span className="font-semibold text-ink">AI Reasoning:</span>{' '}
                            {insight.reason}
                          </p>
                        )}
                        {insight.recommendation && (
                          <p className="text-sm leading-relaxed text-brand font-medium">
                            <span className="font-semibold text-ink">Recommendation:</span>{' '}
                            {insight.recommendation}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                        <p className="text-sm text-ink-soft">
                          Do you want to know more about this?
                        </p>
                        <Link href={`/insights/${insight.id}`}>
                          <Button className="h-8 gap-1.5 px-3 text-xs" variant="soft">
                            <Sparkles className="h-3 w-3" />
                            Deep Dive
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-line px-8 py-4">
                <Pagination
                  currentPage={currentValidPage}
                  onPageChange={setPage}
                  pageSize={1}
                  totalItems={insights.length}
                  totalPages={totalPages}
                />
              </div>
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
