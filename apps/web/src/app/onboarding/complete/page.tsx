import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';

export default function OnboardingCompletePage() {
  return (
    <OnboardingShell
      currentStep="complete"
      title="You are ready to enter your SpendWise dashboard."
      description="Completion should reinforce confidence: remind the user what is configured, what will happen first, and where to go next."
    >
      <div className="space-y-8">
        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-brand/10 text-brand">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-ink">Setup complete</h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
            SpendWise is ready with your preferred currency, budget rhythm, top categories, and
            first savings goal. The dashboard should now greet the user with immediate value.
          </p>
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            'Add your first expense',
            'Review budgets and fixed costs',
            'Read your first AI insight',
          ].map((item) => (
            <SurfaceCard key={item} className="px-5 py-5">
              <p className="text-lg font-semibold text-ink">{item}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep first actions visible within one or two taps from the dashboard.
              </p>
            </SurfaceCard>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/dashboard">Enter dashboard</Link>
          </Button>
          <Button asChild variant="soft">
            <Link href="/transactions">Go straight to expenses</Link>
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}
