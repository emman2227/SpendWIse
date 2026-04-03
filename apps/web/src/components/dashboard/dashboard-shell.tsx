import { formatCurrency, formatShortDate } from '@spendwise/shared';

import { sampleExpenses, sampleForecast, sampleInsights } from '@/lib/sample-data';

import { MetricCard } from '../ui/metric-card';

const totalSpent = sampleExpenses.reduce((sum, expense) => sum + expense.amount, 0);

const categoryBreakdown = [
  { name: 'Housing', amount: 1850 },
  { name: 'Shopping', amount: 1200 },
  { name: 'Food', amount: 420 },
];

export const DashboardShell = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-mesh bg-sand p-8 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Dashboard</p>
            <h1 className="text-4xl font-semibold tracking-tight text-ink">
              See how your money behaves, not just where it went.
            </h1>
            <p className="text-base leading-7 text-slate-600">
              The starter dashboard highlights monthly totals, category pressure, and early AI-based
              signals so you can grow SpendWise into a full personal finance product.
            </p>
          </div>
          <div className="rounded-[28px] bg-ink px-6 py-5 text-white">
            <p className="text-sm text-white/70">Forecast next month</p>
            <p className="mt-2 text-3xl font-semibold">
              {formatCurrency(sampleForecast.predictedAmount)}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {Math.round(sampleForecast.confidence * 100)}% confidence from starter model
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total expenses"
          value={formatCurrency(totalSpent)}
          helper="Based on seeded starter transactions"
        />
        <MetricCard
          label="Budget status"
          value="82%"
          helper="Flexible categories remain under target"
        />
        <MetricCard label="Recent activity" value="3 txns" helper="Latest posted on Mar 25, 2026" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">Recent transactions</h2>
              <p className="text-sm text-slate-500">
                Starter data shared across the repo for fast UI iteration.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {sampleExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-4"
              >
                <div>
                  <p className="font-medium text-ink">{expense.description}</p>
                  <p className="text-sm text-slate-500">
                    {expense.categoryId} / {formatShortDate(expense.date)}
                  </p>
                </div>
                <span className="font-semibold text-ink">{formatCurrency(expense.amount)}</span>
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">Category breakdown</h2>
            <div className="mt-5 space-y-4">
              {categoryBreakdown.map((category) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                    <span>{category.name}</span>
                    <span>{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-brand to-accent"
                      style={{ width: `${Math.min(100, (category.amount / totalSpent) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-ink">AI insights</h2>
            <div className="mt-5 space-y-4">
              {sampleInsights.map((insight) => (
                <div key={insight.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                    {insight.type}
                  </p>
                  <p className="mt-2 font-semibold text-ink">{insight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.message}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
