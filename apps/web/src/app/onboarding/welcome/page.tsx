import { ArrowRight, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { onboardingBenefits } from '@/lib/demo-data';

const cards = [
  {
    title: 'Expense tracking',
    description: 'Capture daily spending quickly with category, method, notes, and tags.',
    icon: Wallet,
  },
  {
    title: 'AI insights',
    description: 'Translate raw transactions into habits, trends, and actionable explanations.',
    icon: Sparkles,
  },
  {
    title: 'Forecasting',
    description: 'Preview likely month-end pressure before budgets drift too far off course.',
    icon: TrendingUp,
  },
];

export default function OnboardingWelcomePage() {
  return (
    <OnboardingShell
      currentStep="welcome"
      title="Let's tailor SpendWise to how you actually manage money."
      description="Keep onboarding short, friendly, and confidence-building. Each step introduces one decision at a time and explains why it matters."
    >
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <SurfaceCard key={card.title} className="px-5 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-ink">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </SurfaceCard>
            );
          })}
        </div>

        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <p className="font-semibold text-ink">What you will set up in the next two minutes</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {onboardingBenefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-[22px] border border-white/80 bg-sage/30 px-4 py-4 text-sm text-slate-600"
              >
                {benefit}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/onboarding/setup">
              Start setup
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="soft">
            <Link href="/dashboard">Skip for now</Link>
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}
