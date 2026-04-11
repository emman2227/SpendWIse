'use client';

import { formatShortDate } from '@spendwise/shared';
import {
  CircleAlert,
  CircleX,
  CreditCard,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Textarea } from '@/components/ui/textarea';
import { transactions } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

const groupedTransactions = [
  { label: 'Today', items: transactions.slice(0, 2) },
  { label: 'Yesterday', items: transactions.slice(2, 4) },
  { label: 'Earlier this week', items: transactions.slice(4, 6) },
];

const totalVisible = transactions.reduce((total, transaction) => total + transaction.amount, 0);
const recurringCount = transactions.filter((transaction) => transaction.recurring).length;
const flaggedCount = transactions.filter((transaction) => transaction.alert).length;
const averageTransaction = totalVisible / Math.max(transactions.length, 1);

const categoryFilters = ['All', 'Food', 'Transport', 'Shopping', 'Health', 'Recurring'];
const quickCapturePresets = ['Groceries', 'Subscription', 'Commute', 'Dining out'];

const transactionTone: Record<string, string> = {
  Food: 'bg-emerald/10 text-emerald',
  Transport: 'bg-sky-100 text-sky-700',
  Shopping: 'bg-amber-100 text-amber-700',
  Health: 'bg-rose-100 text-rose-700',
  Entertainment: 'bg-violet-100 text-violet-700',
};

export default function TransactionsPage() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button variant="soft">Export CSV</Button>
              <Button onClick={() => setIsQuickAddOpen(true)} variant="secondary">
                Add expense
              </Button>
            </>
          }
          description="The transaction screen now centers the three jobs users actually have: find a charge fast, understand what needs attention, and add a new expense without losing context."
          eyebrow="Expense tracking"
          meta={
            <>
              <Badge variant="info">Quick capture focused</Badge>
              <Badge variant="neutral">Horizontal transaction rows</Badge>
            </>
          }
          title="Track spending with less searching and less guesswork."
        />

        <section className="grid gap-4 xl:grid-cols-3">
          <MetricCard
            delta={`${transactions.length} entries`}
            helper="Visible transactions in this view"
            icon={ReceiptText}
            label="Visible spend"
            value={formatMoney(totalVisible)}
          />
          <MetricCard
            delta={recurringCount ? `${recurringCount} matched` : 'All clear'}
            helper="Charges likely to repeat next cycle"
            icon={CreditCard}
            label="Recurring detected"
            tone="mint"
            value={recurringCount.toString()}
          />
          <MetricCard
            delta={flaggedCount ? 'Needs a look' : 'No flags'}
            helper={`Average expense ${formatMoney(averageTransaction)}`}
            icon={CircleAlert}
            label="Review queue"
            value={flaggedCount.toString()}
          />
        </section>

        <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto,auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-11" placeholder="Search merchant, note, amount, or tag" />
              </div>
              <button
                className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand/30 hover:text-ink"
                type="button"
              >
                April 2026
              </button>
              <button
                className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand/30 hover:text-ink"
                type="button"
              >
                All payment methods
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((item, index) => (
                <button
                  key={item}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    index === 0
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-line bg-white text-slate-600 hover:border-brand/30 hover:text-ink'
                  }`}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="rounded-[28px] border border-brand/10 bg-[linear-gradient(140deg,rgba(15,123,113,0.08),rgba(255,255,255,0.92))] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="kicker">What this view tells you</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">
                    The most important transaction work is already surfaced.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Review the flagged charge, search faster, and open quick add without losing your
                    place in the list.
                  </p>
                </div>
                <Sparkles className="mt-1 h-5 w-5 shrink-0 text-brand" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Ready to review
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {flaggedCount} flagged charge{flaggedCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Quick capture
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    Add expense opens in a modal
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    List behavior
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    Compact rows, faster scanning
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Transaction list</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Scan the latest activity in one horizontal pass
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                The rows now mirror the compact dashboard card rhythm so amounts, dates, and actions
                stay aligned.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Newest first</Badge>
              <Badge variant="info">Grouped by day</Badge>
              <Button onClick={() => setIsQuickAddOpen(true)} variant="secondary">
                Add expense
              </Button>
              <Button variant="soft">
                <SlidersHorizontal className="h-4 w-4" />
                More filters
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-6">
            {groupedTransactions.map((group) => {
              const groupTotal = group.items.reduce((total, item) => total + item.amount, 0);

              return (
                <div key={group.label}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {group.label}
                    </p>
                    <p className="text-sm font-medium text-slate-500">{formatMoney(groupTotal)}</p>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {group.items.map((transaction) => {
                      const toneClass =
                        transactionTone[transaction.category] ?? 'bg-slate-100 text-slate-700';

                      return (
                        <article
                          key={transaction.id}
                          className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
                        >
                          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex min-w-0 items-center gap-3.5">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-sm font-semibold ${toneClass}`}
                              >
                                {transaction.merchant.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-[15px] font-semibold text-ink">
                                    {transaction.merchant}
                                  </p>
                                  <Badge variant={transaction.alert ? 'warning' : 'neutral'}>
                                    {transaction.category}
                                  </Badge>
                                  {transaction.recurring ? (
                                    <Badge variant="info">Recurring</Badge>
                                  ) : null}
                                  {transaction.alert ? (
                                    <Badge variant="danger">Needs review</Badge>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{transaction.note}</p>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3 xl:flex xl:items-center xl:gap-2.5">
                              <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2 xl:min-w-[104px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Date
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {formatShortDate(transaction.date)}
                                </p>
                              </div>
                              <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2 xl:min-w-[156px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Method
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {transaction.paymentMethod}
                                </p>
                              </div>
                              <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2 xl:min-w-[136px]">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Tags
                                </p>
                                <p className="mt-1 text-sm font-medium text-ink">
                                  {transaction.tags.join(' / ')}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2.5 xl:min-w-[190px] xl:items-end">
                              <div className="xl:text-right">
                                <p className="text-lg font-semibold text-ink">
                                  {formatMoney(transaction.amount)}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {transaction.alert
                                    ? 'Review recommended'
                                    : transaction.recurring
                                      ? 'Looks like a scheduled charge'
                                      : 'Normal activity'}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                                  type="button"
                                >
                                  Edit
                                </button>
                                <button
                                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                                  type="button"
                                >
                                  Split
                                </button>
                                <button
                                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                                  type="button"
                                >
                                  Move
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <EmptyState
            action={<Button variant="soft">Create a smart filter</Button>}
            className="mt-5 rounded-[24px] px-5 py-6"
            description="The empty state is still available, but it now sits after the higher-value tasks instead of competing with them."
            icon={Search}
            title="No uncategorized expenses right now"
          />
        </SurfaceCard>
      </div>

      {isQuickAddOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(19,38,63,0.42)] px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="panel-surface-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] px-5 py-5 md:px-7 md:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kicker">Quick add</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">
                  Capture an expense without leaving the page
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Keep the form short, keep the defaults obvious, and return to the list right after
                  saving.
                </p>
              </div>
              <button
                aria-label="Close add expense modal"
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-line bg-white text-slate-500 transition hover:border-brand/30 hover:text-ink"
                onClick={() => setIsQuickAddOpen(false)}
                type="button"
              >
                <CircleX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {quickCapturePresets.map((preset) => (
                <button
                  key={preset}
                  className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand/30 hover:text-ink"
                  type="button"
                >
                  {preset}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Amount</span>
                  <Input placeholder="$0.00" />
                </label>
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Category</span>
                  <Input placeholder="Food, transport, shopping..." />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Date</span>
                  <Input placeholder="Apr 11, 2026" />
                </label>
                <label className="space-y-2 text-sm font-medium text-ink">
                  <span>Payment method</span>
                  <Input placeholder="Visa ending 1842" />
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Merchant or description</span>
                <Input placeholder="Where did you spend?" />
              </label>

              <label className="space-y-2 text-sm font-medium text-ink">
                <span>Notes or tags</span>
                <Textarea
                  className="min-h-[110px]"
                  placeholder="Optional notes, labels, or context"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary">
                  Save expense
                </Button>
                <Button onClick={() => setIsQuickAddOpen(false)} type="button" variant="soft">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
