'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SurfaceCard } from '@/components/ui/surface-card';
import { createGoal } from '@/lib/goals/client';

const goalPresets = [
  {
    title: 'Build emergency savings',
    description: 'Use recurring and forecast views to protect long-term savings.',
    defaultAmount: '3000',
    notes: 'Three-month safety buffer',
  },
  {
    title: 'Reduce dining spend',
    description: 'Pair this with budget alerts and dining insights.',
    defaultAmount: '500',
    notes: 'Cut back on non-essential food delivery and restaurant spend',
  },
  {
    title: 'Stay under shopping budget',
    description: 'Establish clear impulse-spending guardrails.',
    defaultAmount: '1000',
    notes: 'Shopping buffer and reward budget',
  },
  {
    title: 'Prepare for travel',
    description: 'Build a dedicated fund for vacations and flights.',
    defaultAmount: '2000',
    notes: 'Travel and vacation fund',
  },
  {
    title: 'Track fixed monthly obligations',
    description: 'Stay ahead of bills, utilities, and subscriptions.',
    defaultAmount: '1500',
    notes: 'Fixed commitments and insurance',
  },
];

const getDefaultTargetDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().slice(0, 10);
};

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const [selectedGoalTitle, setSelectedGoalTitle] = useState<string>(goalPresets[0]?.title ?? '');
  const [targetAmount, setTargetAmount] = useState<string>(goalPresets[0]?.defaultAmount ?? '3000');
  const [targetDate, setTargetDate] = useState<string>(getDefaultTargetDate());
  const [notes, setNotes] = useState<string>(goalPresets[0]?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectPreset = (preset: (typeof goalPresets)[number]) => {
    setSelectedGoalTitle(preset.title);
    setTargetAmount(preset.defaultAmount);
    setNotes(preset.notes);
    setErrorMessage('');
  };

  const handleFinishSetup = async () => {
    const amountNum = Number(targetAmount.replace(/[^\d.]/g, ''));

    if (selectedGoalTitle && amountNum > 0 && targetDate) {
      setIsSubmitting(true);
      setErrorMessage('');
      try {
        const isoDate = new Date(`${targetDate}T12:00:00Z`).toISOString();
        await createGoal({
          title: selectedGoalTitle,
          targetAmount: amountNum,
          currentAmount: 0,
          targetDate: isoDate,
          notes: notes || undefined,
        });
        router.push('/onboarding/complete');
      } catch (err) {
        // Fallback gracefully so user is not blocked from completing onboarding
        console.error('Failed to create onboarding goal:', err);
        router.push('/onboarding/complete');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      router.push('/onboarding/complete');
    }
  };

  return (
    <OnboardingShell
      currentStep="goals"
      description="Goals keep the experience motivating. SpendWise should frame this step as hopeful and useful, never guilt-heavy."
      title="Connect the product to a real financial outcome."
    >
      <div className="space-y-8">
        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <p className="text-sm font-semibold text-ink">Pick a primary goal to start</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {goalPresets.map((preset) => {
              const isSelected = selectedGoalTitle === preset.title;
              return (
                <button
                  key={preset.title}
                  className={`rounded-[22px] border px-4 py-4 text-left text-sm transition ${
                    isSelected
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-line bg-paper-strong text-ink-soft hover:border-brand/30 hover:text-ink'
                  }`}
                  onClick={() => handleSelectPreset(preset)}
                  type="button"
                >
                  <p className="font-semibold">{preset.title}</p>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <p className="text-sm font-semibold text-ink">Customize your target</p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-soft" htmlFor="goal-amount">
                Target amount
              </label>
              <Input
                id="goal-amount"
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="3000"
                value={targetAmount}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-soft" htmlFor="goal-date">
                Target date
              </label>
              <Input
                id="goal-date"
                onChange={(e) => setTargetDate(e.target.value)}
                type="date"
                value={targetDate}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-ink-soft" htmlFor="goal-notes">
              Goal note (optional)
            </label>
            <Input
              id="goal-notes"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Target emergency buffer"
              value={notes}
            />
          </div>

          {errorMessage ? <p className="mt-3 text-sm text-danger">{errorMessage}</p> : null}
        </SurfaceCard>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="soft">
            <Link href="/onboarding/preferences">Back</Link>
          </Button>
          <Button disabled={isSubmitting} onClick={handleFinishSetup} variant="secondary">
            {isSubmitting ? 'Saving...' : 'Finish setup'}
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}
