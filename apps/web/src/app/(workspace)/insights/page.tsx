import { Lightbulb, Sparkles } from 'lucide-react';

import { SpendingOverviewChart } from '@/components/charts/finance-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { insights, spendingTrend } from '@/lib/demo-data';

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Refresh analysis</Button>
            <Button variant="secondary">Save recommendation</Button>
          </>
        }
        description="AI insights should read like a thoughtful analyst, not a vague chatbot: concise summary first, supporting data second, and a transparent explanation pattern throughout."
        eyebrow="AI insights"
        meta={
          <>
            <Badge variant="info">Human-friendly summaries</Badge>
            <Badge variant="neutral">Why am I seeing this?</Badge>
          </>
        }
        title="Translate spending behavior into clear, trustworthy guidance."
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="kicker">Trend context</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                Use the chart to support narrative, not replace it
              </h2>
            </div>
            <Sparkles className="h-6 w-6 text-brand" />
          </div>

          <div className="mt-6">
            <SpendingOverviewChart data={spendingTrend} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Transparency pattern</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Why am I seeing this?</h2>

          <div className="mt-5 space-y-4">
            {insights.slice(0, 2).map((insight) => (
              <div
                key={insight.id}
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <p className="text-sm font-semibold text-ink">Reason</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{insight.why}</p>
                <p className="mt-4 text-sm font-semibold text-ink">Evidence</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{insight.evidence}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Insight cards</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Present the most helpful narratives first
          </h2>

          <div className="mt-6 grid gap-4">
            {insights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-[26px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant={
                      insight.tone === 'success'
                        ? 'success'
                        : insight.tone === 'warning'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {insight.label}
                  </Badge>
                  <span className="text-sm text-slate-400">AI-generated summary</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-ink">{insight.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{insight.summary}</p>
                <div className="mt-5 rounded-[22px] border border-white/80 bg-sage/30 px-4 py-4">
                  <p className="text-sm font-semibold text-ink">Supporting evidence</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.evidence}</p>
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="kicker">Recommendations</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">
                Small changes with clear expected impact
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              'Move recurring subscriptions into a fixed-cost group',
              'Split one-time workspace purchases from normal shopping',
              'Keep weekday dining under two transactions per week',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <p className="font-semibold text-ink">{item}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Show the expected benefit in plain language so the recommendation feels actionable
                  rather than abstract.
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
