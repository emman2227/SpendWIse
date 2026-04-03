import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { summaryMetrics } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';
import { primaryNavigation, secondaryNavigation } from '@/lib/navigation';

const trustPoints = [
  'Data-rich dashboard with calm visual hierarchy',
  'AI insights that explain the why behind each recommendation',
  'Budget, recurring, anomaly, and forecast flows designed as one system',
];

export default function HomePage() {
  const remainingBudgetMetric =
    summaryMetrics[1] ??
    ({ label: 'Remaining budget', value: 0, delta: 0, helper: 'No data yet' } as const);
  const savingsTrendMetric =
    summaryMetrics[3] ??
    ({ label: 'Savings trend', value: 0, delta: 0, helper: 'No data yet' } as const);

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="panel-surface flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-brand">SPENDWISE</p>
            <p className="mt-2 text-sm text-slate-500">
              Premium UI system for AI-led personal finance tracking
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="soft">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <SurfaceCard className="rounded-[36px] px-7 py-8 md:px-10 md:py-10">
            <Badge variant="info">Production-ready product direction</Badge>
            <div className="mt-6 max-w-3xl space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-ink md:text-[4.35rem] md:leading-[1.02]">
                Calm, intelligent money tracking that feels built for real life.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                SpendWise now has a full UI and UX structure for authentication, onboarding,
                dashboarding, spending analysis, anomaly detection, forecasting, reporting, and
                settings in one polished fintech experience.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="soft">
                <Link href="/onboarding/welcome">Preview onboarding</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {trustPoints.map((point) => (
                <article
                  key={point}
                  className="rounded-[24px] border border-white/80 bg-gradient-to-br from-white to-sage/50 px-5 py-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{point}</p>
                </article>
              ))}
            </div>
          </SurfaceCard>

          <div className="space-y-6">
            <SurfaceCard className="hero-gradient rounded-[36px] px-7 py-8 text-white md:px-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                Spend snapshot
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <MetricCard
                  helper="Available for the month"
                  label="Remaining budget"
                  tone="ink"
                  value={formatMoney(remainingBudgetMetric.value)}
                />
                <MetricCard
                  helper="Projected month-end pace"
                  label="Savings trend"
                  tone="ink"
                  value={`${savingsTrendMetric.value}%`}
                />
              </div>
              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/70">Behavior confidence</p>
                    <p className="mt-2 text-2xl font-semibold">76%</p>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-white/80" />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  The interface is designed so AI outputs always pair a recommendation with a reason
                  and supporting evidence.
                </p>
              </div>
            </SurfaceCard>

            <SurfaceCard className="rounded-[32px] px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="kicker">Flow coverage</p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink">
                    Full product architecture, not just a dashboard skin.
                  </h2>
                </div>
                <TrendingUp className="h-10 w-10 text-brand" />
              </div>
              <div className="mt-6 space-y-4">
                <ProgressBar
                  helper="16 core modules mapped"
                  label="Screen inventory coverage"
                  status="brand"
                  value={100}
                />
                <ProgressBar
                  helper="Responsive nav, cards, tables, and charts"
                  label="Component system"
                  status="safe"
                  value={92}
                />
                <ProgressBar
                  helper="Auth, onboarding, transactions, budgets, settings"
                  label="Major flows"
                  status="warning"
                  value={88}
                />
              </div>
            </SurfaceCard>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <SurfaceCard className="rounded-[36px] px-7 py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="kicker">Primary modules</p>
                <h2 className="mt-3 text-3xl font-semibold text-ink">
                  Navigation designed for fast scanability and low-friction action.
                </h2>
              </div>
              <Button asChild variant="soft">
                <Link href="/settings">View settings</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {primaryNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[26px] border border-white/80 bg-white/80 px-5 py-5 transition-all hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-ink">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </Link>
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[36px] px-7 py-8">
            <p className="kicker">Supporting areas</p>
            <div className="mt-4 space-y-4">
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 hover:shadow-soft"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{item.label}</p>
                      <p className="text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 rounded-[26px] border border-white/80 bg-gradient-to-br from-mint to-white px-5 py-5">
              <p className="text-sm font-semibold text-ink">Live system note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The web app now contains module pages, auth screens, onboarding, and a UX
                architecture doc to support product and engineering handoff together.
              </p>
            </div>
          </SurfaceCard>
        </section>

        <section className="panel-surface-strong rounded-[36px] px-7 py-8 md:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="kicker">Ready to explore</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">
                Start with the dashboard or walk the user journey from auth through setup.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/dashboard">Open product</Link>
              </Button>
              <Button asChild variant="soft">
                <Link href="/register">Start auth flow</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
