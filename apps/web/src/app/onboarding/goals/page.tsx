import Link from 'next/link';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SurfaceCard } from '@/components/ui/surface-card';

const goalOptions = [
  'Build emergency savings',
  'Reduce dining spend',
  'Stay under shopping budget',
  'Prepare for travel',
  'Track fixed monthly obligations',
];

export default function OnboardingGoalsPage() {
  return (
    <OnboardingShell
      currentStep="goals"
      title="Connect the product to a real financial outcome."
      description="Goals keep the experience motivating. SpendWise should frame this step as hopeful and useful, never guilt-heavy."
    >
      <div className="space-y-8">
        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <p className="text-sm font-semibold text-ink">Pick one or two goals to start</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {goalOptions.map((goal, index) => (
              <button
                key={goal}
                className={`rounded-[22px] border px-4 py-4 text-left text-sm ${
                  index < 2
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-line bg-white text-slate-600'
                }`}
                type="button"
              >
                <p className="font-semibold">{goal}</p>
                <p className="mt-2 leading-6">
                  {index === 0
                    ? 'Use recurring and forecast views to protect long-term savings.'
                    : 'Pair this with budget alerts and dining insights.'}
                </p>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="goal-amount">
                Target amount
              </label>
              <Input id="goal-amount" placeholder="$3,000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="goal-date">
                Target date
              </label>
              <Input id="goal-date" placeholder="September 2026" />
            </div>
          </div>
        </SurfaceCard>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="soft">
            <Link href="/onboarding/preferences">Back</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/onboarding/complete">Finish setup</Link>
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}
