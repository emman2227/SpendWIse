import Link from 'next/link';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SurfaceCard } from '@/components/ui/surface-card';

const currencies = ['USD', 'PHP', 'EUR', 'GBP'];
const incomeRanges = ['$2k - $4k', '$4k - $7k', '$7k - $12k', '$12k+'];

export default function OnboardingSetupPage() {
  return (
    <OnboardingShell
      currentStep="setup"
      title="Start with the basics that shape budgets and summaries."
      description="Currency, income range, and a light monthly baseline help SpendWise make dashboard numbers immediately meaningful."
    >
      <div className="space-y-8">
        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">Preferred currency</p>
            <div className="flex flex-wrap gap-3">
              {currencies.map((currency, index) => (
                <button
                  key={currency}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    index === 0
                      ? 'bg-brand text-white'
                      : 'border border-line bg-white text-slate-600 hover:border-brand hover:text-brand'
                  }`}
                  type="button"
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="monthly-income">
                Monthly income range
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {incomeRanges.map((range, index) => (
                  <button
                    key={range}
                    className={`rounded-[22px] border px-4 py-3 text-sm font-semibold ${
                      index === 1
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-line bg-white text-slate-600'
                    }`}
                    type="button"
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600" htmlFor="monthly-target">
                Monthly spending target
              </label>
              <Input id="monthly-target" placeholder="$5,800" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <p className="text-sm font-semibold text-ink">Budget rhythm</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {['Calendar month', 'Every 4 weeks', 'Flexible cycle'].map((item, index) => (
              <button
                key={item}
                className={`rounded-[22px] border px-4 py-4 text-left text-sm ${
                  index === 0
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-line bg-white text-slate-600'
                }`}
                type="button"
              >
                <p className="font-semibold">{item}</p>
                <p className="mt-2 leading-6">
                  {index === 0
                    ? 'Best for salary and bill cycles.'
                    : index === 1
                      ? 'Useful for weekly-pay households.'
                      : 'Good for custom planning cadences.'}
                </p>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="soft">
            <Link href="/onboarding/welcome">Back</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/onboarding/preferences">Continue</Link>
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}
