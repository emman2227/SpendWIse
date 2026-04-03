import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { onboardingBenefits } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

interface OnboardingShellProps {
  currentStep: 'welcome' | 'setup' | 'preferences' | 'goals' | 'complete';
  title: string;
  description: string;
  children: ReactNode;
}

const steps = [
  { id: 'welcome', label: 'Welcome', caption: 'See what SpendWise can do' },
  { id: 'setup', label: 'Basic setup', caption: 'Currency, income, and habits' },
  { id: 'preferences', label: 'Preferences', caption: 'Tracking categories and alerts' },
  { id: 'goals', label: 'Goals', caption: 'Savings and spending targets' },
  { id: 'complete', label: 'Complete', caption: 'Enter your new dashboard' },
] as const;

export const OnboardingShell = ({
  currentStep,
  title,
  description,
  children,
}: OnboardingShellProps) => {
  const activeIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="panel-surface-strong hidden h-fit flex-col gap-8 p-6 lg:flex lg:sticky lg:top-6">
          <div className="space-y-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to account setup
            </Link>
            <p className="kicker">Guided onboarding</p>
            <h2 className="text-2xl font-semibold text-ink">
              Short, calm setup for a smarter money workspace.
            </h2>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const complete = index < activeIndex;
              const active = index === activeIndex;

              return (
                <div key={step.id} className="flex gap-3">
                  <div
                    className={cn(
                      'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                      complete
                        ? 'border-brand bg-brand text-white'
                        : active
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-line bg-white text-slate-400',
                    )}
                  >
                    {complete ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <div>
                    <p className={cn('font-semibold', active ? 'text-ink' : 'text-slate-500')}>
                      {step.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{step.caption}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-white/80 bg-gradient-to-br from-mint to-white px-5 py-5">
            <p className="text-sm font-semibold text-ink">What users unlock immediately</p>
            <ul className="mt-4 space-y-3">
              {onboardingBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="panel-surface-strong px-6 py-7 md:px-10 md:py-10">
          <div className="space-y-3">
            <p className="kicker">
              Step {activeIndex + 1} of {steps.length}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
              {description}
            </p>
          </div>

          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
};
