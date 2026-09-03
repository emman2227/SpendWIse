'use client';

import {
  ArrowRight,
  BellRing,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Layers,
  Lock,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Wallet,
  WalletCards,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';

import { InteractiveAiDemo } from '@/components/marketing/interactive-ai-demo';
import { LandingHeader } from '@/components/marketing/landing-header';
import { LandingHeroPreview } from '@/components/marketing/landing-hero-preview';
import { SavingsCalculator } from '@/components/marketing/savings-calculator';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '#preview', label: 'Preview' },
  { href: '#features', label: 'Features' },
  { href: '#ai-sandbox', label: 'AI Sandbox' },
  { href: '#calculator', label: 'Savings Calculator' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#faq', label: 'FAQ' },
];

const topStats = [
  {
    icon: Wallet,
    value: '$2.4M+',
    label: 'Tracked Spending',
    detail: 'Across smart budgets',
  },
  {
    icon: Sparkles,
    value: '99.8%',
    label: 'ML Tagging Accuracy',
    detail: 'Zero manual sorting',
  },
  {
    icon: TrendingUp,
    value: '14.2%',
    label: 'Avg Monthly Savings',
    detail: 'Recaptured from leaks',
  },
  {
    icon: Clock3,
    value: '4.5 hrs',
    label: 'Saved Per Month',
    detail: 'Over manual spreadsheets',
  },
];

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Your Free Profile',
    description:
      'Set up in under 30 seconds. Choose your preferred currency, monthly baseline, and financial goals.',
  },
  {
    step: '02',
    icon: Layers,
    title: 'Track With Auto-Categorization',
    description:
      'Log expenses or imports seamlessly. SpendWise automatically categorizes merchants and spending pillars.',
  },
  {
    step: '03',
    icon: BrainCircuit,
    title: 'Unlock Proactive AI Intelligence',
    description:
      'Receive personalized forecasting, instant anomaly alerts, and actionable recommendations to grow savings.',
  },
];

const faqs = [
  {
    question: 'How does SpendWise AI analyze and forecast my spending?',
    answer:
      'SpendWise uses machine learning heuristics and pattern recognition to compare your current spending velocity against your historical averages, recurring bills, and category budgets. It flags unusual spikes and forecasts your end-of-month trajectory in real time.',
  },
  {
    question: 'Is my financial data safe, private, and encrypted?',
    answer:
      'Yes, absolutely. SpendWise employs strict industry-standard encryption protocols and secure session authentication. Your financial data is solely yours and is never sold, shared with third-party advertisers, or monetized.',
  },
  {
    question: 'Do I need to enter credit card info to get started?',
    answer:
      'No credit card is required. You can register and access the core SpendWise platform, budgeting tools, categories, and AI insights 100% free.',
  },
  {
    question: 'Can I track expenses in multiple currencies or custom categories?',
    answer:
      'Yes! SpendWise supports customizable multi-currency formatting (USD, EUR, GBP, PHP, JPY, CAD, AUD, and more) as well as unlimited custom spending categories and goal envelopes.',
  },
];

const footerColumns = [
  {
    title: 'Product',
    links: ['Live Preview', 'AI Copilot', 'Smart Budgets', 'Anomaly Radar', 'Integrations'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Changelog', 'Security & Privacy', 'Help Center'],
  },
  {
    title: 'Resources',
    links: ['Financial Guides', 'Budgeting 101', 'API Docs', 'Status'],
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <LandingHeader items={navItems} />

      <main className="min-h-screen overflow-x-hidden pt-20 md:pt-24">
        {/* ========================================================
            HERO SECTION
           ======================================================== */}
        <section className="relative px-4 pb-16 pt-6 sm:px-6 md:pb-24 md:pt-12">
          {/* Subtle Ambient Radial Lighting */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[550px] w-full max-w-6xl -translate-x-1/2 opacity-60 blur-3xl [background:radial-gradient(circle_at_center,rgba(15,123,113,0.18)_0%,rgba(36,161,133,0.08)_50%,transparent_75%)]"
          />

          <div className="mx-auto max-w-5xl text-center">
            {/* Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Generation AI Financial Copilot</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl md:text-6xl md:leading-[1.1]"
            >
              Master Your Money with{' '}
              <span className="bg-gradient-to-r from-brand via-emerald to-brand-strong bg-clip-text text-transparent">
                Intelligent Clarity
              </span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg sm:leading-relaxed"
            >
              Eliminate spreadsheet chaos. SpendWise automatically categorizes expenses, predicts
              end-of-month spending, and alerts you to hidden leaks before they happen.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
            >
              <Button
                asChild
                className="h-12 min-w-[190px] text-sm font-semibold shadow-lift shadow-brand/20 transition-transform hover:scale-[1.02]"
                size="lg"
                variant="secondary"
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-12 min-w-[150px] border border-line bg-paper text-sm font-semibold text-ink hover:bg-surface-muted"
                size="lg"
                variant="outline"
              >
                <a href="#ai-sandbox">
                  <Bot className="mr-2 h-4 w-4 text-brand" />
                  Try AI Sandbox
                </a>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-soft font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-brand" />
                <span>Bank-Grade Encryption</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-warning" />
                <span>Real-Time ML Insights</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Live Dashboard Mockup */}
          <motion.div
            id="preview"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-12 md:mt-16"
          >
            <LandingHeroPreview />
          </motion.div>
        </section>

        {/* ========================================================
            SOCIAL PROOF & STATS BANNER
           ======================================================== */}
        <section className="border-y border-line bg-surface-muted/30 px-4 py-10 md:px-6 md:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {topStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                        {stat.value}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink">
                      {stat.label}
                    </p>
                    <p className="text-xs text-ink-soft">{stat.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================
            BENTO GRID FEATURES
           ======================================================== */}
        <section className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24" id="features">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
                <Layers className="h-3.5 w-3.5" />
                Designed for Effortless Control
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
                Everything You Need to Own Your Cashflow
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
                SpendWise combines automated bookkeeping, behavioral intelligence, and proactive
                anomaly detection into one unified, elegant cockpit.
              </p>
            </div>

            {/* Bento Grid Layout */}
            <div className="mt-12 grid gap-6 md:grid-cols-12">
              {/* Bento Card 1: AI Predictive Forecast (Wide / Span 7) */}
              <div className="rounded-[28px] border border-line-strong/60 bg-paper p-6 shadow-soft transition-all duration-300 hover:border-brand/40 hover:shadow-lift md:col-span-7 md:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-sm shadow-brand/20">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold text-brand">
                    Predictive ML Engine
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  Forward-Looking Spending Forecasts
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Stop looking backwards at stale reports. SpendWise calculates your day-by-day
                  trajectory to forecast end-of-month balances and flag potential deficits 2 weeks
                  in advance.
                </p>

                <div className="mt-6 rounded-2xl border border-line/70 bg-surface-muted/50 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-ink">Projected Month-End Spend</span>
                    <span className="text-emerald font-bold">$2,840 / $3,200 Cap</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-brand to-emerald" />
                  </div>
                  <p className="mt-2 text-[11px] text-ink-soft">
                    🟢 Pace is safe: You are on track to bank{' '}
                    <strong className="text-brand">$360 into savings</strong>.
                  </p>
                </div>
              </div>

              {/* Bento Card 2: Smart Auto-Categorization (Span 5) */}
              <div className="flex flex-col justify-between rounded-[28px] border border-line-strong/60 bg-paper p-6 shadow-soft transition-all duration-300 hover:border-brand/40 hover:shadow-lift md:col-span-5 md:p-8">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-mint text-brand shadow-sm">
                    <PieChart className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    Smart Auto-Tagging
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    Zero manual tagging. Clean merchant names, tax tags, and lifestyle buckets are
                    automatically organized instantly.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 pt-2">
                  <span className="rounded-xl border border-line bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink">
                    ☕ Starbucks → Dining
                  </span>
                  <span className="rounded-xl border border-line bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink">
                    🛍️ Amazon → Supplies
                  </span>
                  <span className="rounded-xl border border-line bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink">
                    ✈️ Uber → Transit
                  </span>
                  <span className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">
                    +42 Smart Rules
                  </span>
                </div>
              </div>

              {/* Bento Card 3: Real-Time Anomaly Radar (Span 5) */}
              <div className="flex flex-col justify-between rounded-[28px] border border-line-strong/60 bg-paper p-6 shadow-soft transition-all duration-300 hover:border-brand/40 hover:shadow-lift md:col-span-5 md:p-8">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger/10 text-danger shadow-sm">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    Anomaly &amp; Leak Radar
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    Instant alerts whenever an abnormal charge, price hike, or forgotten recurring
                    bill occurs.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-danger">
                    <BellRing className="h-3.5 w-3.5 animate-pulse" />
                    <span>Unusual Charge Alert</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    &quot;Gym Membership jumped from $45 to $75 without notice.&quot;
                  </p>
                </div>
              </div>

              {/* Bento Card 4: Dynamic Smart Budgets & Envelopes (Span 7) */}
              <div className="rounded-[28px] border border-line-strong/60 bg-paper p-6 shadow-soft transition-all duration-300 hover:border-brand/40 hover:shadow-lift md:col-span-7 md:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/15 text-warning shadow-sm">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-bold text-ink-soft">
                    Adaptive Envelopes
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  Adaptive Smart Budgets
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Set dynamic guardrails that flex with your lifestyle. SpendWise automatically
                  rebalances categories when unexpected life events happen.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-line bg-surface-muted/50 p-3">
                    <p className="text-[11px] font-medium text-ink-soft">Groceries</p>
                    <p className="text-sm font-bold text-ink">$420 / $500</p>
                    <p className="text-[10px] text-emerald font-semibold">84% Used • Safe</p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface-muted/50 p-3">
                    <p className="text-[11px] font-medium text-ink-soft">Entertainment</p>
                    <p className="text-sm font-bold text-ink">$190 / $200</p>
                    <p className="text-[10px] text-warning font-semibold">95% Used • Close</p>
                  </div>
                  <div className="rounded-xl border border-line bg-surface-muted/50 p-3 col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-medium text-ink-soft">Savings Goal</p>
                    <p className="text-sm font-bold text-brand">$650 / $600</p>
                    <p className="text-[10px] text-brand font-semibold">108% • Goal Exceeded!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            INTERACTIVE AI PLAYGROUND / SANDBOX
           ======================================================== */}
        <section
          className="scroll-mt-24 border-y border-line bg-surface-muted/30 px-4 py-16 md:px-6 md:py-24"
          id="ai-sandbox"
        >
          <InteractiveAiDemo />
        </section>

        {/* ========================================================
            SAVINGS ROI CALCULATOR
           ======================================================== */}
        <section className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24" id="calculator">
          <SavingsCalculator />
        </section>

        {/* ========================================================
            HOW IT WORKS (3-STEP JOURNEY)
           ======================================================== */}
        <section className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24" id="how-it-works">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
                <Zap className="h-3.5 w-3.5" />
                Quick Onboarding
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
                Start Saving in 3 Simple Steps
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
                No complicated accounting setup. Be fully up and running in under 2 minutes.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="relative rounded-[28px] border border-line-strong/60 bg-paper p-6 shadow-soft transition-all duration-300 hover:border-brand/40 hover:shadow-lift md:p-8"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand">
                        STEP {item.step}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-brand">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <h3 className="mt-6 text-lg font-bold tracking-tight text-ink sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-xs leading-relaxed text-ink-soft sm:text-sm">
                      {item.description}
                    </p>

                    {idx < steps.length - 1 && (
                      <div
                        aria-hidden="true"
                        className="absolute -right-3.5 top-1/2 hidden -translate-y-1/2 rounded-full border border-line bg-paper p-1.5 text-brand shadow-sm md:block"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================
            FAQ ACCORDION
           ======================================================== */}
        <section
          className="scroll-mt-24 border-t border-line bg-surface-muted/20 px-4 py-16 md:px-6 md:py-24"
          id="faq"
        >
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
                <ShieldCheck className="h-3.5 w-3.5" />
                Frequently Asked Questions
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Got Questions? We Have Answers.
              </h2>
            </div>

            <div className="mt-10 space-y-3.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-2xl border border-line-strong/60 bg-paper transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-ink sm:text-base hover:text-brand"
                      type="button"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-ink-soft transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-brand' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-line/60 bg-surface-muted/30 px-5 pb-5 pt-3 text-xs leading-relaxed text-ink-soft sm:text-sm">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================
            FINAL CALL-TO-ACTION BANNER
           ======================================================== */}
        <section className="relative px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-brand/40 bg-gradient-to-br from-brand via-brand-strong to-ink p-8 text-center text-white shadow-lift sm:p-12 md:p-16">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-warning" />
                Join Thousands Saving Smarter
              </div>

              <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Take Full Control of Your Financial Future Today
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
                Stop wondering where your paycheck went. Experience intelligent expense tracking and
                effortless budgeting right now.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <Button
                  asChild
                  className="h-12 min-w-[200px] bg-white text-sm font-bold text-brand hover:bg-white/90 shadow-lg"
                  size="lg"
                >
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-12 min-w-[140px] border border-white/20 bg-white/10 text-sm font-semibold text-white hover:bg-white/20 backdrop-blur-md"
                  size="lg"
                >
                  <Link href="/login">Log In</Link>
                </Button>
              </div>

              <p className="mt-6 text-xs text-white/70">
                ⚡ 100% Free to start • No credit card required • Instant setup
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            FOOTER
           ======================================================== */}
        <footer className="border-t border-line bg-paper-strong px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 pb-10 sm:grid-cols-2 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                    <WalletCards className="h-4 w-4" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-ink">SpendWise</span>
                </div>
                <p className="mt-4 max-w-sm text-xs leading-relaxed text-ink-soft sm:text-sm">
                  SpendWise is a premium AI-powered personal finance intelligence platform for
                  modern budgets, spending forecasts, and automated wealth optimization.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-brand">
                  <ShieldCheck className="h-4 w-4 text-emerald" />
                  <span>ISO-Grade Data Privacy &amp; Security</span>
                </div>
              </div>

              {footerColumns.map((col) => (
                <div key={col.title}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                    {col.title}
                  </h4>
                  <ul className="mt-3.5 space-y-2 text-xs font-medium text-ink-soft sm:text-sm">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#preview" className="transition-colors hover:text-brand">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-line/70 pt-8 text-xs text-ink-soft sm:flex-row">
              <p>{'\u00A9'} 2026 SpendWise. All rights reserved.</p>
              <div className="flex items-center gap-5">
                <a href="#preview" className="hover:text-ink">
                  Privacy Policy
                </a>
                <a href="#preview" className="hover:text-ink">
                  Terms of Service
                </a>
                <a href="#preview" className="hover:text-ink">
                  Security
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
