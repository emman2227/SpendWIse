import { CalendarClock, Repeat2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { recurringPayments } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

const recurringTotal = recurringPayments.reduce((sum, item) => sum + item.amount, 0);

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

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Repeat2 className="h-5 w-5" />
            </div>
            <div>
              <p className="kicker">Monthly recurring total</p>
              <h2 className="mt-2 text-3xl font-semibold text-ink">
                {formatMoney(recurringTotal)}
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
            <p className="text-sm font-semibold text-ink">Upcoming charges</p>
            <div className="mt-4 space-y-3">
              {recurringPayments.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">{formatMoney(item.amount)}</p>
                    <p className="text-sm text-slate-500">{item.nextCharge.slice(0, 10)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="kicker">Recurring payments list</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                Fixed monthly obligations at a glance
              </h2>
            </div>
            <CalendarClock className="h-6 w-6 text-brand" />
          </div>

          <div className="mt-6 space-y-4">
            {recurringPayments.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.frequency} / {item.paymentMethod}
                    </p>
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
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-ink">{formatMoney(item.amount)}</p>
                  <p className="text-sm text-slate-500">
                    Next charge {item.nextCharge.slice(0, 10)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
