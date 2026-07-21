'use client';

import {
  ArrowRight,
  BrainCircuit,
  ChartColumnIncreasing,
  Clock3,
  ShieldAlert,
  Sparkles,
  Target,
  UserPlus,
  WalletCards,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import { LandingHeader } from '@/components/marketing/landing-header';
import { Button } from '@/components/ui/button';
import { fadeInUp, staggerContainer, staggerItem } from '@/config/animations';

const navItems = [
  { href: '#features', label: 'Features' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#how-it-works', label: 'How It Works' },
];

const topMetrics = [
  { label: 'Total Spending', value: '$3,350', helper: '-5.2%' },
  { label: 'Budget Used', value: '78%', helper: 'On Track' },
  { label: 'Remaining', value: '$1,650', helper: '+$200' },
  { label: 'Savings', value: '$850', helper: '+12%' },
];

const features = [
  {
    icon: WalletCards,
    title: 'Track Expenses',
    description:
      'Log and categorize every transaction effortlessly with smart auto-categorization.',
  },
  {
    icon: BrainCircuit,
    title: 'AI-Powered Insights',
    description:
      'Get personalized spending analysis and recommendations powered by machine learning.',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Forecast Spending',
    description: 'Predict future expenses based on your habits and plan ahead with confidence.',
  },
  {
    icon: Target,
    title: 'Smart Budgets',
    description: 'Set intelligent budgets that adapt to your lifestyle and spending patterns.',
  },
];

const benefits = [
  {
    icon: Clock3,
    title: 'Category Analytics',
    description: 'See exactly where your money goes with beautiful breakdowns.',
  },
  {
    icon: ShieldAlert,
    title: 'Unusual Activity Detection',
    description: 'Instant alerts when spending patterns look different than usual.',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Rich Reports',
    description: 'Weekly, monthly, and yearly reports with export options.',
  },
  {
    icon: Sparkles,
    title: 'Ask SpendWise',
    description: 'Chat with your AI assistant to get instant answers about your finances.',
  },
];

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Your Account',
    description:
      'Sign up in seconds. No credit card required. Start your journey to smarter spending today.',
  },
  {
    step: '02',
    icon: WalletCards,
    title: 'Connect & Track',
    description:
      'Add your expenses manually or connect accounts. SpendWise automatically categorizes every transaction.',
  },
  {
    step: '03',
    icon: Zap,
    title: 'Get AI Insights',
    description:
      'Receive personalized recommendations, spending forecasts, and actionable tips to save more.',
  },
];

const footerColumns = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'Security', 'Integrations'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Contact'],
  },
  {
    title: 'Legal',
    links: ['Privacy', 'Terms', 'Cookie Policy'],
  },
];

const sectionTitleClasses =
  'text-center text-[2rem] font-semibold tracking-tight text-ink md:text-[2.35rem] md:leading-[1.08]';

export default function HomePage() {
  return (
    <>
      <LandingHeader items={navItems} />

      <main className="min-h-screen pb-0 pt-15 md:pt-[4.35rem]">
        <section className="mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            className="flex min-h-[calc(100svh-7rem)] flex-col items-center justify-center rounded-[40px] px-4 py-6 text-center md:min-h-[calc(100svh-7.5rem)] md:py-7"
            initial="hidden"
            variants={staggerContainer}
            viewport={{ amount: 0.3, once: true }}
            whileInView="visible"
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1.5 text-[0.7rem] font-medium text-brand md:text-[0.8rem]"
              variants={fadeInUp}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Finance Intelligence
            </motion.div>

            <motion.div className="mt-6 max-w-5xl space-y-4" variants={fadeInUp}>
              <h1 className="text-[1.85rem] font-semibold tracking-tight text-ink sm:text-[2.35rem] md:text-[3.45rem] md:leading-[0.95]">
                Master Your Money with
                <span className="block text-brand">Intelligent</span>
                Spending Analysis
              </h1>
              <p className="mx-auto max-w-3xl text-[0.94rem] leading-6 text-slate-500 md:text-[1.04rem] md:leading-[1.45]">
                Track expenses, understand habits, predict future spending, and get personalized AI
                recommendations all in one beautifully designed dashboard.
              </p>
            </motion.div>

            <motion.div
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
              variants={fadeInUp}
            >
              <Button asChild className="min-w-[168px] text-[0.9rem]" size="lg" variant="secondary">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="min-w-[112px] text-[0.9rem]" size="lg" variant="soft">
                <Link href="/login">Log In</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <section className="px-4 pb-14 md:px-6 md:pb-16">
          <div className="mx-auto max-w-[1220px] rounded-[28px] border border-line/80 bg-white/82 p-4 shadow-soft md:p-6">
            <motion.div
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              initial="hidden"
              variants={staggerContainer}
              viewport={{ amount: 0.3, once: true }}
              whileInView="visible"
            >
              {topMetrics.map((metric) => (
                <motion.article
                  key={metric.label}
                  className="rounded-[20px] bg-gradient-to-br from-[rgba(221,236,231,0.9)] to-[rgba(250,252,249,0.92)] px-4 py-4"
                  variants={staggerItem}
                >
                  <p className="text-[0.86rem] font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-[1.65rem] font-semibold tracking-tight text-ink">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-[0.86rem] font-medium text-brand">{metric.helper}</p>
                </motion.article>
              ))}
            </motion.div>

            <div className="mt-5 rounded-[22px] bg-gradient-to-br from-[rgba(237,244,241,0.96)] to-[rgba(247,250,248,0.92)] px-5 py-10 md:px-6 md:py-11">
              <div className="flex items-center justify-center gap-3 text-center text-[0.92rem] text-slate-500 md:text-[1.08rem]">
                <ChartColumnIncreasing className="h-5 w-5 text-slate-400" />
                <span>Interactive spending charts &amp; AI insights</span>
              </div>
            </div>
          </div>
        </section>

        <section className="scroll-mt-24 px-4 py-12 md:px-6 md:py-16" id="features">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className={sectionTitleClasses}>Everything You Need to Take Control</h2>
              <p className="mt-4 text-base leading-7 text-slate-500 md:text-[1.08rem] md:leading-[1.45]">
                Powerful features designed to give you complete visibility and control over your
                finances.
              </p>
            </div>

            <motion.div
              className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
              initial="hidden"
              variants={staggerContainer}
              viewport={{ amount: 0.3, once: true }}
              whileInView="visible"
            >
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <motion.article
                    key={feature.title}
                    className="rounded-[22px] border border-line/80 bg-white/88 px-5 py-5 shadow-soft"
                    variants={staggerItem}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-brand text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-[1.22rem] font-semibold tracking-tight text-ink">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-[0.92rem] leading-7 text-slate-500">
                      {feature.description}
                    </p>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section
          className="scroll-mt-24 border-y border-white/40 bg-[rgba(220,236,231,0.42)] px-4 py-14 md:px-6 md:py-16"
          id="benefits"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className={sectionTitleClasses}>Smarter Finance, Simpler Life</h2>
              <p className="mt-4 text-base leading-7 text-slate-500 md:text-[1.04rem]">
                Advanced tools wrapped in an intuitive experience.
              </p>
            </div>

            <motion.div
              className="mt-8 grid gap-5 sm:grid-cols-2"
              initial="hidden"
              variants={staggerContainer}
              viewport={{ amount: 0.3, once: true }}
              whileInView="visible"
            >
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <motion.article
                    key={benefit.title}
                    className="flex gap-4 rounded-[22px] border border-line/80 bg-white/90 px-5 py-5 shadow-soft"
                    variants={staggerItem}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(221,236,231,0.72)] text-brand">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-[1.18rem] font-semibold tracking-tight text-ink">
                        {benefit.title}
                      </h3>
                      <p className="mt-2 text-[0.92rem] leading-7 text-slate-500">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section className="scroll-mt-24 px-4 py-14 md:px-6 md:py-16" id="how-it-works">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className={sectionTitleClasses}>Get Started in Minutes</h2>
              <p className="mt-4 text-base leading-7 text-slate-500 md:text-[1.08rem] md:leading-[1.45]">
                Three simple steps to transform the way you manage your money.
              </p>
            </div>

            <motion.div
              className="mt-8 grid gap-5 sm:grid-cols-3"
              initial="hidden"
              variants={staggerContainer}
              viewport={{ amount: 0.3, once: true }}
              whileInView="visible"
            >
              {steps.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    className="relative rounded-[22px] border border-line/80 bg-white/90 px-5 py-6 shadow-soft"
                    variants={staggerItem}
                  >
                    <span className="text-[0.78rem] font-semibold tracking-widest text-brand/60">
                      STEP {item.step}
                    </span>
                    <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-[1.22rem] font-semibold tracking-tight text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[0.92rem] leading-7 text-slate-500">
                      {item.description}
                    </p>

                    {index < steps.length - 1 && (
                      <div className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white sm:flex">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section className="mt-6 bg-ink px-4 py-14 text-white md:px-6 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="text-[1.75rem] font-semibold tracking-tight sm:text-[2.2rem] md:text-[2.75rem]">
                Ready to Take Control of Your Finances?
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-white/75 md:text-[1.02rem]">
                Join thousands of users already saving smarter with SpendWise.
              </p>
              <div className="mt-7">
                <Button asChild className="min-w-[180px] text-sm" size="lg" variant="secondary">
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <footer className="px-4 py-10 md:px-6 md:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-7 border-b border-line/80 pb-9 sm:grid-cols-2 md:grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-brand text-white">
                    <WalletCards className="h-4 w-4" />
                  </div>
                  <span className="text-[1.35rem] font-semibold tracking-tight text-ink">
                    SpendWise
                  </span>
                </div>
                <p className="mt-4 max-w-sm text-[0.92rem] leading-7 text-slate-500">
                  AI-powered spending analysis for smarter financial decisions.
                </p>
              </div>

              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h3 className="text-base font-semibold text-ink">{column.title}</h3>
                  <ul className="mt-3 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link} className="text-[0.92rem] text-slate-500">
                        <a href="#" className="transition-colors hover:text-ink">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="pt-6 text-center text-[0.82rem] text-slate-500">
              {'\u00A9'} 2026 SpendWise. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
