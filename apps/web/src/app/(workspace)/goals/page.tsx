'use client';

import { CircleX, Flag, PiggyBank, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { goals } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

const goalPresets = ['Emergency fund', 'Vacation', 'Laptop upgrade', 'Debt payoff'];

export default function GoalsPage() {
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);

  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const leadingGoal = goals.reduce((leader, goal) =>
    goal.saved / goal.target > leader.saved / leader.target ? goal : leader,
  );

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button variant="soft">Review savings ideas</Button>
              <Button onClick={() => setIsCreateGoalOpen(true)} variant="secondary">
                Create goal
              </Button>
            </>
          }
          description="Goals should feel motivating and practical. This redesign makes progress, momentum, and next-step suggestions easier to review without splitting focus."
          eyebrow="Goals and savings"
          meta={
            <>
              <Badge variant="success">Motivating progress view</Badge>
              <Badge variant="info">AI savings opportunities</Badge>
            </>
          }
          title="Connect everyday spending to meaningful financial progress."
        />

        <section className="grid gap-4 xl:grid-cols-3">
          <MetricCard
            delta={`${goals.length} active`}
            helper="Savings goals currently being tracked"
            icon={Target}
            label="Goal library"
            value={goals.length.toString()}
          />
          <MetricCard
            delta="Saved so far"
            helper={`Across ${goals.length} active goals`}
            icon={PiggyBank}
            label="Total saved"
            tone="mint"
            value={formatMoney(totalSaved)}
          />
          <MetricCard
            delta="Leading goal"
            helper={`${leadingGoal.title} has the strongest momentum`}
            icon={TrendingUp}
            label="Total target"
            value={formatMoney(totalTarget)}
          />
        </section>

        <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="kicker">Goal snapshot</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">
                  The best goals view keeps progress visible and the next move obvious.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This workspace keeps savings progress, deadlines, and helpful cutback ideas close
                  together so goals feel achievable instead of abstract.
                </p>
              </div>
              <Button onClick={() => setIsCreateGoalOpen(true)} size="sm" variant="secondary">
                Create goal
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Leading goal
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">{leadingGoal.title}</p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Momentum
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {Math.round((totalSaved / totalTarget) * 100)}% of combined target funded
                </p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Best next move
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  Review cutbacks tied to your active goals
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
          <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="kicker">Goal progress</p>
                <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                  Review savings progress in one calm, compact pass
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                  Each row keeps the target, deadline, current progress, and next encouragement
                  close together so users can stay motivated without hunting around the page.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">Progress-first layout</Badge>
                <Badge variant="info">Horizontal rows</Badge>
                <Button onClick={() => setIsCreateGoalOpen(true)} variant="secondary">
                  Create goal
                </Button>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {goals.map((goal) => {
                const progress = (goal.saved / goal.target) * 100;

                return (
                  <article
                    key={goal.id}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                  >
                    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(240px,0.95fr),minmax(280px,1.15fr)] lg:items-center lg:gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand/10 text-brand">
                          <Flag className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[15px] font-semibold text-ink">{goal.title}</p>
                            <Badge variant="success">In progress</Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{goal.deadline}</p>
                        </div>
                      </div>

                      <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3">
                        <ProgressBar
                          helper={`${formatMoney(goal.saved)} of ${formatMoney(goal.target)}`}
                          size="sm"
                          status="safe"
                          value={progress}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2.5 border-t border-line/70 pt-3 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-between">
                      <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:gap-2.5">
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Completion
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">
                            {Math.round(progress)}% funded
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Encouragement
                          </p>
                          <p className="mt-1 text-sm font-medium text-ink">{goal.helper}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                          type="button"
                        >
                          Add funds
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="kicker">Savings opportunities</p>
                <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                  Suggested cutbacks that connect back to your goals
                </h2>
              </div>
              <Sparkles className="h-5 w-5 text-brand" />
            </div>

            <div className="mt-5 space-y-2.5">
              {[
                'Trim two cafe visits per week to unlock about $110 monthly',
                'Reclassify one-time workspace buys so shopping feels less noisy',
                'Review paused subscriptions before the next renewal cycle',
              ].map((item) => (
                <article
                  key={item}
                  className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
                >
                  <p className="font-semibold text-ink">{item}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Show the behavior link to the goal so recommendations feel personal and useful.
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-brand/15 bg-brand/5 px-4 py-4">
              <p className="font-semibold text-ink">Why this works</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Savings advice lands better when the user can immediately connect the behavior to a
                visible goal instead of reading it as generic budgeting advice.
              </p>
            </div>
          </SurfaceCard>
        </section>
      </div>

      {isCreateGoalOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,38,63,0.42)] px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="panel-surface-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] px-5 py-5 md:px-7 md:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kicker">Create goal</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">
                  Add a savings goal without leaving the page
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Keep setup lightweight so users can create a goal, set a target, and go straight
                  back to reviewing progress.
                </p>
              </div>
              <button
                aria-label="Close create goal modal"
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
                onClick={() => setIsCreateGoalOpen(false)}
                type="button"
              >
                <CircleX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {goalPresets.map((preset) => (
                <button
                  key={preset}
                  className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                  type="button"
                >
                  {preset}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4">
              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Goal name</span>
                <Input placeholder="Emergency fund" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Target amount</span>
                  <Input placeholder="$3,000" />
                </label>
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Deadline</span>
                  <Input placeholder="September 2026" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Starting amount</span>
                  <Input placeholder="$0" />
                </label>
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Contribution note</span>
                  <Input placeholder="Weekly transfer, extra savings, etc." />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary">
                  Save goal
                </Button>
                <Button onClick={() => setIsCreateGoalOpen(false)} type="button" variant="soft">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
