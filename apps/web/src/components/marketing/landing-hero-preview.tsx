'use client';

import {
  Brain,
  CheckCircle2,
  PieChart as PieIcon,
  Sparkles,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const mockDataSets = {
  '30d': [
    { day: 'Day 1', spend: 120, budget: 150 },
    { day: 'Day 5', spend: 340, budget: 350 },
    { day: 'Day 10', spend: 520, budget: 600 },
    { day: 'Day 15', spend: 890, budget: 950 },
    { day: 'Day 20', spend: 1240, budget: 1300 },
    { day: 'Day 25', spend: 1680, budget: 1750 },
    { day: 'Day 30', spend: 2150, budget: 2400 },
  ],
  '7d': [
    { day: 'Mon', spend: 45, budget: 60 },
    { day: 'Tue', spend: 90, budget: 120 },
    { day: 'Wed', spend: 180, budget: 180 },
    { day: 'Thu', spend: 240, budget: 240 },
    { day: 'Fri', spend: 390, budget: 320 },
    { day: 'Sat', spend: 510, budget: 450 },
    { day: 'Sun', spend: 610, budget: 550 },
  ],
};

const topCategories = [
  { name: 'Dining & Cafes', amount: '$640', share: '38%', color: '#0F7B71', change: '+8%' },
  { name: 'Groceries', amount: '$420', share: '25%', color: '#24A185', change: '-4%' },
  { name: 'Tech & Subs', amount: '$310', share: '18%', color: '#CE9844', change: '0%' },
  { name: 'Transit', amount: '$180', share: '11%', color: '#5B6A7D', change: '-12%' },
];

export function LandingHeroPreview() {
  const [timeframe, setTimeframe] = useState<'30d' | '7d'>('30d');
  const [activeCategory, setActiveCategory] = useState<number | null>(0);

  const data = mockDataSets[timeframe];

  return (
    <div className="relative mx-auto w-full max-w-5xl select-none">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-brand/20 via-surface-mint/40 to-brand/10 opacity-70 blur-2xl transition duration-1000 dark:from-brand/10 dark:via-brand-strong/10 dark:to-transparent"
      />

      {/* Main Glassmorphic Dashboard Window */}
      <div className="relative rounded-[28px] border border-line-strong/60 bg-paper/95 p-4 shadow-lift backdrop-blur-2xl transition-all duration-300 hover:border-brand/40 sm:p-6 md:rounded-[36px] md:p-8">
        {/* Top Window Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/70 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-danger/80" />
              <span className="h-3 w-3 rounded-full bg-warning/80" />
              <span className="h-3 w-3 rounded-full bg-emerald/80" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              SpendWise Live Intelligence
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-1">
            <button
              onClick={() => setTimeframe('7d')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                timeframe === '7d'
                  ? 'bg-paper text-brand shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
              type="button"
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                timeframe === '30d'
                  ? 'bg-paper text-brand shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
              type="button"
            >
              Monthly Pace
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="group rounded-2xl border border-line/60 bg-surface-muted/60 p-3.5 transition duration-200 hover:bg-surface-muted md:p-4">
            <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
              <span>Total Spent</span>
              <Wallet className="h-3.5 w-3.5 text-brand" />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-ink md:text-2xl">
              {timeframe === '30d' ? '$2,150.00' : '$610.00'}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[0.75rem] font-medium text-emerald">
              <TrendingDown className="h-3 w-3" />
              <span>8.4% under budget</span>
            </div>
          </div>

          <div className="group rounded-2xl border border-line/60 bg-surface-muted/60 p-3.5 transition duration-200 hover:bg-surface-muted md:p-4">
            <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
              <span>Remaining Cap</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald" />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-ink md:text-2xl">
              {timeframe === '30d' ? '$850.00' : '$190.00'}
            </p>
            <p className="mt-1 text-[0.75rem] font-medium text-ink-soft">28% safe margin</p>
          </div>

          <div className="group rounded-2xl border border-line/60 bg-surface-muted/60 p-3.5 transition duration-200 hover:bg-surface-muted md:p-4">
            <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
              <span>AI Forecast</span>
              <Brain className="h-3.5 w-3.5 text-brand" />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-brand md:text-2xl">
              $2,820 max
            </p>
            <div className="mt-1 flex items-center gap-1 text-[0.75rem] font-medium text-brand">
              <CheckCircle2 className="h-3 w-3" />
              <span>Goal achievable</span>
            </div>
          </div>

          <div className="group rounded-2xl border border-line/60 bg-surface-muted/60 p-3.5 transition duration-200 hover:bg-surface-muted md:p-4">
            <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
              <span>Detected Savings</span>
              <Sparkles className="h-3.5 w-3.5 text-warning" />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-ink md:text-2xl">+$165/mo</p>
            <p className="mt-1 text-[0.75rem] font-medium text-warning">2 idle subscriptions</p>
          </div>
        </div>

        {/* Interactive Chart + Category Breakdown */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Chart View */}
          <div className="rounded-2xl border border-line/60 bg-surface-muted/30 p-4 lg:col-span-7">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand" />
                <span className="text-xs font-semibold text-ink">Actual Spending Pace</span>
                <span className="text-xs text-ink-soft">vs. Target Budget</span>
              </div>
              <span className="text-[11px] font-medium text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">
                Optimal Rhythm
              </span>
            </div>

            <div className="mt-3 h-52 w-full sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F7B71" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0F7B71" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="#8898AA"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#8898AA" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 252, 247, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(92, 113, 132, 0.2)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="budget"
                    stroke="#9BA6B5"
                    strokeDasharray="4 4"
                    fill="none"
                    strokeWidth={1.5}
                    name="Target Cap"
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="#0F7B71"
                    strokeWidth={3}
                    fill="url(#heroSpendGrad)"
                    name="Observed Spend"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Category List */}
          <div className="flex flex-col justify-between rounded-2xl border border-line/60 bg-surface-muted/30 p-4 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-brand" />
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wide">
                    Top Spending Pillars
                  </h4>
                </div>
                <span className="text-[11px] text-ink-soft">Auto-categorized</span>
              </div>

              <div className="space-y-2">
                {topCategories.map((cat, idx) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(idx)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${
                      activeCategory === idx
                        ? 'bg-paper shadow-sm ring-1 ring-brand/30'
                        : 'hover:bg-paper/60'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-ink">{cat.name}</p>
                        <p className="text-[11px] text-ink-soft">{cat.share} of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-ink">{cat.amount}</p>
                      <span
                        className={`text-[10px] font-medium ${
                          cat.change.startsWith('+') ? 'text-warning' : 'text-emerald'
                        }`}
                      >
                        {cat.change}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-mint/30 px-3 py-2 text-xs">
              <span className="font-medium text-ink-soft">AI Budget Recommendation:</span>
              <span className="font-semibold text-brand">Cap Dining at $550/mo</span>
            </div>
          </div>
        </div>

        {/* Floating Interactive Badge (Simulated AI Notification) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">
                SpendWise Copilot Alert: <span className="text-brand font-bold">Safe to Save</span>
              </p>
              <p className="text-xs text-ink-soft">
                You are currently tracking $140 below average weekly dining expenses.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-bold text-brand">
              +14% into Emergency Fund
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
