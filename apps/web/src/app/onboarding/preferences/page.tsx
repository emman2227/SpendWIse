import Link from 'next/link';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';

const categoryOptions = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Travel',
  'Health',
  'Education',
  'Subscriptions',
];

const preferenceRows = [
  'Alert me when a category is close to budget',
  'Explain unusual transactions in plain language',
  'Summarize my month with AI insights',
  'Forecast next month before the current month closes',
];

export default function OnboardingPreferencesPage() {
  return (
    <OnboardingShell
      currentStep="preferences"
      title="Choose the categories and nudges that matter most."
      description="This step uses progressive disclosure: core choices first, optional refinements second, and clear helper text throughout."
    >
      <div className="space-y-8">
        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <p className="text-sm font-semibold text-ink">Categories you care about most</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {categoryOptions.map((category, index) => (
              <button
                key={category}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  index < 4
                    ? 'bg-brand/10 text-brand'
                    : 'border border-line bg-white text-slate-600'
                }`}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Keep selection optional. Suggest defaults, but let the user enter the dashboard quickly.
          </p>
        </SurfaceCard>

        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <p className="text-sm font-semibold text-ink">Notification and AI preferences</p>
          <div className="mt-4 space-y-3">
            {preferenceRows.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-white/80 bg-white/80 px-4 py-4"
              >
                <div>
                  <p className="font-medium text-ink">{item}</p>
                  <p className="text-sm text-slate-500">
                    {index === 0
                      ? 'Useful for staying ahead of overspending.'
                      : index === 1
                        ? 'Builds trust in anomaly detection.'
                        : index === 2
                          ? 'Monthly recap with behavior themes.'
                          : 'Helpful for planning ahead.'}
                  </p>
                </div>
                <div
                  className={`h-7 w-12 rounded-full p-1 ${
                    index !== 2 ? 'bg-brand' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition ${
                      index !== 2 ? 'translate-x-5' : ''
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="soft">
            <Link href="/onboarding/setup">Back</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/onboarding/goals">Continue</Link>
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}
