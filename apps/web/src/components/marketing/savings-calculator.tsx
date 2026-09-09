'use client';

import { ArrowRight, Calculator, Check, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function SavingsCalculator() {
  const [monthlySpend, setMonthlySpend] = useState<number>(3200);

  // Conservative financial models: 14% waste reduction + $45/mo avg subscription leak recapture
  const annualSavings = Math.round(monthlySpend * 0.14 * 12);
  const monthlySavings = Math.round(monthlySpend * 0.14);
  const hoursSavedPerYear = 52; // 1 hour per week on manual budgeting

  return (
    <div className="mx-auto max-w-5xl rounded-[22px] sm:rounded-[32px] border border-line-strong/60 bg-paper p-4 sm:p-8 md:p-10 shadow-lift">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Slider & Inputs */}
        <div className="lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            <Calculator className="h-3.5 w-3.5" />
            ROI &amp; Savings Calculator
          </div>
          <h3 className="mt-3 sm:mt-4 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-ink">
            See How Much SpendWise Can Save You
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">
            By automatically uncovering recurring leaks, overpaying habits, and optimizing budget
            caps, users recover an average of 14% of their monthly spend.
          </p>

          <div className="mt-5 sm:mt-8 rounded-2xl bg-surface-muted/50 p-4 sm:p-5 border border-line/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Monthly Expenses
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-brand">
                ${monthlySpend.toLocaleString()}
              </span>
            </div>

            <input
              type="range"
              min={800}
              max={12000}
              step={100}
              value={monthlySpend}
              onChange={(e) => setMonthlySpend(Number(e.target.value))}
              aria-label="Monthly Expenses Slider"
              className="mt-4 w-full accent-brand cursor-pointer h-2 bg-line rounded-lg appearance-none touch-pan-x"
            />

            <div className="mt-2 flex justify-between text-[10px] sm:text-[11px] text-ink-soft font-medium">
              <span>$800/mo</span>
              <span>$5,000/mo</span>
              <span>$12,000+/mo</span>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-ink-soft sm:text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>No manual receipt entry — 100% automated smart tagging</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-ink-soft sm:text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>Anomaly radar flags double-charges and sneaky price hikes</span>
            </div>
          </div>
        </div>

        {/* Right Column: Projected Output Card */}
        <div className="lg:col-span-6">
          <div className="rounded-[20px] sm:rounded-[24px] border border-brand/20 bg-gradient-to-br from-brand/10 via-surface-mint/30 to-paper p-4 sm:p-7 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand">
              Estimated Value Recaptured
            </span>

            <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink">
                +${annualSavings.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-ink-soft">/ year</span>
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-brand font-medium">
              ≈ ${monthlySavings.toLocaleString()} added back into your bank account monthly
            </p>

            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 pt-3.5 sm:pt-4 border-t border-line/70">
              <div className="rounded-xl bg-paper/90 p-3 sm:p-3.5 border border-line/60">
                <div className="flex items-center gap-1.5 sm:gap-2 text-ink-soft text-[11px] sm:text-xs">
                  <Clock className="h-3.5 w-3.5 text-brand shrink-0" />
                  <span>Time Reclaimed</span>
                </div>
                <p className="mt-1 sm:mt-1.5 text-base sm:text-xl font-bold text-ink">
                  {hoursSavedPerYear} Hours
                </p>
                <p className="text-[9px] sm:text-[10px] text-ink-soft">Zero spreadsheet hassle</p>
              </div>

              <div className="rounded-xl bg-paper/90 p-3 sm:p-3.5 border border-line/60">
                <div className="flex items-center gap-1.5 sm:gap-2 text-ink-soft text-[11px] sm:text-xs">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald shrink-0" />
                  <span>Savings Rate</span>
                </div>
                <p className="mt-1 sm:mt-1.5 text-base sm:text-xl font-bold text-emerald">
                  +14% Growth
                </p>
                <p className="text-[9px] sm:text-[10px] text-ink-soft">Average user impact</p>
              </div>
            </div>

            <div className="mt-5 sm:mt-6">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full text-xs sm:text-sm font-semibold h-11"
              >
                <Link href="/register">
                  Start Saving With SpendWise
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
