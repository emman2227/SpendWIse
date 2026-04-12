import { CalendarClock, CreditCard, Repeat2, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { recurringPayments } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

const recurringTotal = recurringPayments.reduce((sum, item) => sum + item.amount, 0);
const renewingCount = recurringPayments.filter((item) => item.status === 'renewing').length;
const upcomingCount = recurringPayments.filter((item) => item.status === 'upcoming').length;

export default function RecurringPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Detect recurring</Button>
            <Button variant="secondary">Mark transaction recurring</Button>
          </>
        }
        description="Recurring payments deserve one place where users can review fixed costs, upcoming charges, and billing cadence without digging through transactions."
        eyebrow="Recurring expenses"
        meta={
          <>
            <Badge variant="neutral">Calendar-friendly cues</Badge>
            <Badge variant="info">Monthly obligation summary</Badge>
          </>
        }
        title="Track subscriptions, bills, and repeated spending in one calm view."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          delta="Monthly total"
          helper="Combined recurring charges this cycle"
          icon={Wallet}
          label="Recurring spend"
          value={formatMoney(recurringTotal)}
        />
        <MetricCard
          delta={`${renewingCount} renewing`}
          helper="Payments currently active and repeating"
          icon={Repeat2}
          tone="mint"
          label="Active renewals"
          value={renewingCount.toString()}
        />
        <MetricCard
          delta={`${upcomingCount} upcoming`}
          helper="Charges already visible on the near-term calendar"
          icon={CalendarClock}
          label="Upcoming charges"
          value={upcomingCount.toString()}
        />
      </section>

      <SurfaceCard className="overflow-hidden rounded-[34px] px-5 py-5 md:px-6 md:py-6">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="kicker">Recurring snapshot</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">
                Fixed costs are easiest to manage when the next charge is obvious.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This view keeps total recurring spend, charge timing, and status cues close together
                so users can spot renewals and paused items without scanning noisy transaction
                lists.
              </p>
            </div>
            <Button variant="secondary">Add recurring rule</Button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Next focus
              </p>
              <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                Review the next charge dates first
              </p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Strongest use
              </p>
              <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                Separate true subscriptions from one-time noise
              </p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Best next move
              </p>
              <p className="mt-2 text-lg font-semibold leading-tight text-ink">
                Pause anything no longer worth renewing
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <section className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Upcoming charges</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                The next recurring payments in one compact list
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Keep the soonest charges visible so users can anticipate renewals without needing a
                separate calendar screen.
              </p>
            </div>
            <CalendarClock className="h-5 w-5 text-brand" />
          </div>

          <div className="mt-5 space-y-2.5">
            {recurringPayments.slice(0, 3).map((item) => (
              <article
                key={item.id}
                className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.frequency}</p>
                  </div>
                  <Badge
                    variant={
                      item.status === 'paused'
                        ? 'neutral'
                        : item.status === 'upcoming'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {item.status}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Amount
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">{formatMoney(item.amount)}</p>
                  </div>
                  <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Next charge
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {item.nextCharge.slice(0, 10)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-4 md:px-5 md:py-5">
          <div className="flex flex-col gap-3 border-b border-line/80 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker">Recurring payments list</p>
              <h2 className="mt-2 text-[1.55rem] font-semibold leading-tight text-ink md:text-[1.75rem]">
                Fixed monthly obligations at a glance
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Each row keeps the payment name, cadence, next charge, and method readable without
                forcing labels to collide at tighter widths.
              </p>
            </div>
            <Button variant="soft">Review all renewals</Button>
          </div>

          <div className="mt-5 space-y-2.5">
            {recurringPayments.map((item) => (
              <article
                key={item.id}
                className="rounded-[22px] border border-white/80 bg-white/88 px-3.5 py-3"
              >
                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(240px,0.95fr),minmax(280px,1.15fr)] lg:items-center lg:gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand/10 text-brand">
                      <Repeat2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-semibold text-ink">{item.name}</p>
                        <Badge
                          variant={
                            item.status === 'paused'
                              ? 'neutral'
                              : item.status === 'upcoming'
                                ? 'warning'
                                : 'info'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{item.frequency}</p>
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">Amount</p>
                      <p className="font-semibold text-ink">{formatMoney(item.amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-line/70 pt-3">
                  <div className="grid gap-2.5 lg:grid-cols-[132px,minmax(0,1fr),auto] lg:items-start">
                    <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Next charge
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {item.nextCharge.slice(0, 10)}
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-white/80 bg-white/70 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Payment method
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        <p className="text-sm font-medium leading-6 text-ink">
                          {item.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
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
                        Pause
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
