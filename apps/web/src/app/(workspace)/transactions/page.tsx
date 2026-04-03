import { formatShortDate } from '@spendwise/shared';
import { CreditCard, Search, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
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

export default function TransactionsPage() {
  const highlighted = transactions[4] ?? {
    id: 'fallback-transaction',
    merchant: 'No highlighted transaction',
    category: 'General',
    amount: 0,
    date: new Date().toISOString(),
    paymentMethod: 'No method',
    note: 'No transaction selected.',
    tags: [],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Export CSV</Button>
            <Button variant="secondary">Add expense</Button>
          </>
        }
        description="Transactions stay fast and readable with strong grouping, lightweight filters, and nearby detail and edit actions."
        eyebrow="Expense tracking"
        meta={
          <>
            <Badge variant="neutral">Search, sort, and filter</Badge>
            <Badge variant="info">Day, week, month, or category grouping</Badge>
          </>
        }
        title="Record spending quickly and review it without friction."
      />

      <SurfaceCard className="rounded-[30px] px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-[1fr,auto]">
          <div className="grid gap-4 md:grid-cols-[1fr,auto,auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-11" placeholder="Search merchant, tag, note, or amount" />
            </div>
            <button className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600">
              Date: April 2026
            </button>
            <button className="rounded-[20px] border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600">
              Payment: All methods
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Food', 'Transport', 'Shopping', 'Bills', 'Recurring'].map((item, index) => (
              <button
                key={item}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  index === 0
                    ? 'bg-brand/10 text-brand'
                    : 'border border-line bg-white text-slate-600'
                }`}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="kicker">Transaction list</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                Clean rows with clear category and date grouping
              </h2>
            </div>
            <Button variant="soft">
              <SlidersHorizontal className="h-4 w-4" />
              More filters
            </Button>
          </div>

          <div className="mt-6 space-y-8">
            {groupedTransactions.map((group) => (
              <div key={group.label}>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {group.label}
                </p>
                <div className="mt-4 space-y-3">
                  {group.items.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex flex-col gap-4 rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink">{transaction.merchant}</p>
                          <Badge variant={transaction.alert ? 'warning' : 'neutral'}>
                            {transaction.category}
                          </Badge>
                          {transaction.recurring ? <Badge variant="info">Recurring</Badge> : null}
                        </div>
                        <p className="text-sm leading-6 text-slate-500">
                          {transaction.note} / {formatShortDate(transaction.date)} /{' '}
                          {transaction.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-ink">
                          {formatMoney(transaction.amount)}
                        </p>
                        <p className="text-sm text-slate-500">{transaction.tags.join(' / ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="kicker">Add expense</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">Frictionless manual entry</h2>
              </div>
              <CreditCard className="h-6 w-6 text-brand" />
            </div>

            <form className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="$0.00" />
                <Input placeholder="Category" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Date" />
                <Input placeholder="Payment method" />
              </div>
              <Input placeholder="Merchant or short description" />
              <Textarea placeholder="Add notes or tags" />
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">Save expense</Button>
                <Button variant="soft">Save and add another</Button>
              </div>
            </form>
          </SurfaceCard>

          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <p className="kicker">Transaction detail</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">{highlighted.merchant}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {formatShortDate(highlighted.date)} / {highlighted.paymentMethod}
            </p>
            <p className="mt-6 text-3xl font-semibold text-ink">
              {formatMoney(highlighted.amount)}
            </p>

            <div className="mt-6 space-y-3 rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
              <p className="text-sm font-semibold text-ink">Why this one stands out</p>
              <p className="text-sm leading-6 text-slate-600">
                This transaction is larger than your usual shopping purchase and has been flagged in
                anomaly review. Provide quick actions here rather than forcing a context switch.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary">Edit transaction</Button>
              <Button variant="soft">Mark recurring</Button>
              <Button variant="danger">Delete</Button>
            </div>
          </SurfaceCard>

          <EmptyState
            action={<Button variant="soft">Create a smart filter</Button>}
            description="Use empty states to reassure the user when no transactions match a search or when a review bucket is already clear."
            icon={Search}
            title="No uncategorized expenses right now"
          />
        </div>
      </section>
    </div>
  );
}
