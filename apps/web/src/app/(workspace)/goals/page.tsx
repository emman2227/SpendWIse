import { Flag, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { goals } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Review savings ideas</Button>
            <Button variant="secondary">Create goal</Button>
          </>
        }
        description="Goals should make the app feel supportive and optimistic. Show momentum, milestones, and the spending behaviors that help or hurt progress."
        eyebrow="Goals and savings"
        meta={
          <>
            <Badge variant="success">Motivating copy</Badge>
            <Badge variant="info">AI savings opportunities</Badge>
          </>
        }
        title="Connect everyday spending to meaningful financial progress."
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Goal progress</p>
          <div className="mt-5 space-y-4">
            {goals.map((goal) => {
              const progress = (goal.saved / goal.target) * 100;

              return (
                <div
                  key={goal.id}
                  className="rounded-[26px] border border-white/80 bg-white/80 px-5 py-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{goal.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{goal.deadline}</p>
                    </div>
                    <Flag className="h-5 w-5 text-brand" />
                  </div>
                  <div className="mt-5 space-y-3">
                    <ProgressBar
                      helper={`${formatMoney(goal.saved)} of ${formatMoney(goal.target)}`}
                      status="safe"
                      value={progress}
                    />
                    <p className="text-sm leading-6 text-slate-600">{goal.helper}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <p className="kicker">Create goal</p>
            <div className="mt-5 space-y-4">
              <Input placeholder="Goal name" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="$3,000" />
                <Input placeholder="September 2026" />
              </div>
              <Button variant="secondary">Save goal</Button>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="kicker">Savings opportunities</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Suggested cutbacks</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {[
                'Trim two cafe visits per week to unlock about $110 monthly',
                'Reclassify one-time workspace buys so shopping feels less noisy',
                'Review paused subscriptions before the next renewal cycle',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
                >
                  <p className="font-semibold text-ink">{item}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Show the behavior link to the goal so recommendations feel personal and useful.
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
