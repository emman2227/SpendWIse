'use client';

import { Bot, ChevronRight, HelpCircle, Lightbulb, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface DemoScenario {
  id: string;
  badge: string;
  prompt: string;
  category: string;
  summary: string;
  dataPoints: Array<{ label: string; value: string; hint?: string }>;
  aiAnalysis: string;
  actionableTip: string;
  tone: 'safe' | 'warning' | 'tip';
}

const scenarios: DemoScenario[] = [
  {
    id: 'weekend-dining',
    badge: 'Expense Pattern Analysis',
    prompt: 'How is my weekend food spending trending compared to weekdays?',
    category: 'Dining & Entertainment',
    summary: 'Weekend dining is 2.4x higher than your weekday average.',
    dataPoints: [
      { label: 'Weekday Avg', value: '$22.50 / day', hint: 'Mon - Thu' },
      { label: 'Weekend Avg', value: '$54.00 / day', hint: 'Fri - Sun' },
      { label: 'Pace vs. Budget', value: '+18% over target', hint: 'Dining cap: $450' },
    ],
    aiAnalysis:
      'Most of your weekend delta comes from late-night deliveries and Saturday group dinners. By batch-cooking Sunday lunch, you could easily recapture $130/month without feeling restricted.',
    actionableTip: 'Set an automatic $45/night weekend dining limit in SpendWise alerts.',
    tone: 'warning',
  },
  {
    id: 'concert-affordability',
    badge: 'Purchase Affordability Check',
    prompt: 'Can I afford a $180 concert ticket without breaking my monthly savings goal?',
    category: 'Discretionary Spending',
    summary: 'Yes! You have $310 in unallocated safe buffer this cycle.',
    dataPoints: [
      { label: 'Current Savings Pace', value: '$650 / $600', hint: '108% to target' },
      { label: 'Available Flex Cap', value: '$310.00', hint: 'Post-bills buffer' },
      { label: 'Impact on Savings', value: '0% deficit', hint: 'Goal stays intact' },
    ],
    aiAnalysis:
      'Your utilities were $42 lower than forecasted this month. Purchasing the $180 ticket leaves you with $130 in discretionary flex while keeping your $600 savings milestone 100% on schedule.',
    actionableTip: 'Approved! Categorize this under "Live Events" to track entertainment ROI.',
    tone: 'safe',
  },
  {
    id: 'subscription-audit',
    badge: 'Recurring Leak Detector',
    prompt: 'Audit my recurring subscriptions and flag potential waste.',
    category: 'Subscriptions & SaaS',
    summary: 'Found 2 subscriptions with zero recorded usage in 45 days.',
    dataPoints: [
      { label: 'Total Recurring', value: '$124.90 / mo', hint: '8 active services' },
      { label: 'Identified Waste', value: '$38.00 / mo', hint: '2 idle apps' },
      { label: 'Annual Recapture', value: '$456.00 / yr', hint: 'Instant win' },
    ],
    aiAnalysis:
      'You have not logged into Cloud Storage Plus ($18/mo) since January, and StreamPlay 4K ($20/mo) overlaps with your family plan bundle.',
    actionableTip: 'Cancel Cloud Storage Plus to instantly save $216 this year.',
    tone: 'tip',
  },
];

export function InteractiveAiDemo() {
  const [selectedId, setSelectedId] = useState<string>('weekend-dining');
  const [isSimulating, setIsSimulating] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === selectedId) ?? scenarios[0]!;

  const handleSelect = (id: string) => {
    if (id === selectedId) return;
    setIsSimulating(true);
    setSelectedId(id);
    setTimeout(() => {
      setIsSimulating(false);
    }, 280);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-semibold text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          Interactive AI Sandbox • 100% Free Demo
        </div>
        <h3 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          Ask SpendWise AI Anything
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft md:text-base">
          Experience how SpendWise turns complex, messy banking feeds into immediate clarity,
          actionable answers, and automated savings tips.
        </p>
      </div>

      {/* Preset Scenario Selector Tabs */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedId;
          return (
            <button
              key={scenario.id}
              onClick={() => handleSelect(scenario.id)}
              type="button"
              className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all sm:text-sm ${
                isSelected
                  ? 'border-brand bg-brand text-white shadow-md shadow-brand/20'
                  : 'border-line bg-paper text-ink-soft hover:border-brand/40 hover:text-ink'
              }`}
            >
              <Bot className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-brand'}`} />
              <span>{scenario.prompt.slice(0, 38)}...</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Mock Terminal / AI Card */}
      <div className="mt-6 overflow-hidden rounded-[28px] border border-line-strong/60 bg-paper shadow-lift">
        {/* Chat Prompt Header */}
        <div className="border-b border-line bg-surface-muted/60 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white shadow-sm">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                User Query
              </span>
              <p className="truncate text-sm font-semibold text-ink sm:text-base">
                &ldquo;{activeScenario.prompt}&rdquo;
              </p>
            </div>
            <span className="hidden rounded-full bg-surface-mint px-2.5 py-1 text-xs font-semibold text-brand sm:inline-block">
              {activeScenario.category}
            </span>
          </div>
        </div>

        {/* AI Response Body */}
        <div className="p-5 sm:p-7">
          <AnimatePresence mode="wait">
            {isSimulating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-ink-soft"
              >
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <p className="text-xs font-medium">SpendWise AI is calculating telemetry...</p>
              </motion.div>
            ) : (
              <motion.div
                key={activeScenario.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* AI Header Response */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-sm shadow-brand/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand">
                        SpendWise Copilot
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                      <span className="text-[11px] text-ink-soft">Instant ML Analysis</span>
                    </div>
                    <h4 className="mt-1 text-base font-bold text-ink sm:text-lg">
                      {activeScenario.summary}
                    </h4>
                  </div>
                </div>

                {/* Key Financial Telemetry Chips */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {activeScenario.dataPoints.map((dp) => (
                    <div
                      key={dp.label}
                      className="rounded-2xl border border-line/60 bg-surface-muted/40 p-3.5 transition hover:border-brand/30 hover:bg-surface-muted/70"
                    >
                      <p className="text-xs font-medium text-ink-soft">{dp.label}</p>
                      <p className="mt-1 text-lg font-bold tracking-tight text-ink">{dp.value}</p>
                      {dp.hint && (
                        <p className="mt-0.5 text-[11px] font-medium text-brand">{dp.hint}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Detailed AI Reasoning */}
                <div className="rounded-2xl bg-surface-muted/50 p-4 text-xs leading-relaxed text-ink-soft sm:text-sm sm:leading-relaxed">
                  <p>{activeScenario.aiAnalysis}</p>
                </div>

                {/* Actionable Recommendation Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-brand/30 bg-surface-mint/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lightbulb className="h-5 w-5 shrink-0 text-brand" />
                    <p className="text-xs font-semibold text-ink sm:text-sm">
                      <span className="text-brand font-bold">Suggested Move: </span>
                      {activeScenario.actionableTip}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary" className="shrink-0 text-xs">
                    <a href="/register">
                      Automate This
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
