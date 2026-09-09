'use client';

import { ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useCurrentUserQuery } from '@/lib/auth/client';
import { alerts } from '@/lib/demo-data';
import { formatMoney as baseFormatMoney } from '@/lib/formatters';

export default function AnomaliesPage() {
  const { data: user } = useCurrentUserQuery();
  const formatMoney = (amount: number) => baseFormatMoney(amount, user?.currency ?? 'PHP');

  const selected = alerts[0] ?? {
    id: 'fallback-alert',
    severity: 'info' as const,
    merchant: 'No alerts right now',
    category: 'Monitoring',
    amount: 0,
    date: '',
    reason: 'SpendWise has not detected unusual or suspicious transactions in this period.',
    suggestedAction: 'No action is needed. Continue reviewing alerts as new transactions arrive.',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Dismiss all reviewed</Button>
            <Button variant="secondary">Review flagged spend</Button>
          </>
        }
        description="Anomaly detection should feel watchful, not alarming. Use clear reasons, calm colors, and direct next steps for each flagged transaction."
        eyebrow="Anomaly detection"
        meta={
          <>
            <Badge variant="warning">Unusual activity review</Badge>
            <Badge variant="neutral">Reason + action + confirmation</Badge>
          </>
        }
        title="Highlight the transactions that deserve a second look."
      />

      <section className="grid gap-6 lg:grid-cols-[1fr,0.95fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <p className="kicker">Alerts list</p>
          <h2 className="mt-2 text-xl font-semibold text-ink sm:mt-3 sm:text-2xl">
            Each alert should be reviewable in one pass
          </h2>

          <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-[20px] border border-line bg-paper px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{alert.merchant}</p>
                      <p className="text-xs text-ink-soft sm:text-sm">{alert.category}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      alert.severity === 'danger'
                        ? 'danger'
                        : alert.severity === 'warning'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-soft sm:mt-4 sm:text-sm sm:leading-6">
                  {alert.reason}
                </p>
                <p className="mt-3 text-base font-semibold text-ink sm:mt-4">
                  {formatMoney(alert.amount)}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <p className="kicker">Alert detail</p>
          <h2 className="mt-2 text-xl font-semibold text-ink sm:mt-3 sm:text-2xl">
            {selected.merchant}
          </h2>
          <p className="mt-1 text-xs text-ink-soft sm:mt-2 sm:text-sm">
            {selected.category} anomaly
          </p>

          <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
            <div className="rounded-[20px] border border-warning/25 bg-warning/10 px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5">
              <p className="text-xs font-semibold text-ink sm:text-sm">Reason for flagging</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:mt-2 sm:text-sm sm:leading-6">
                {selected.reason}
              </p>
            </div>

            <div className="rounded-[20px] border border-line bg-paper px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5">
              <p className="text-xs font-semibold text-ink sm:text-sm">Suggested action</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:mt-2 sm:text-sm sm:leading-6">
                {selected.suggestedAction}
              </p>
            </div>

            <div className="rounded-[20px] border border-line bg-sage/30 px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5">
              <p className="text-xs font-semibold text-ink sm:text-sm">Review guidance</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:mt-2 sm:text-sm sm:leading-6">
                Keep confirmation controls close to the explanation so users can mark the alert as
                expected or important without hunting for next steps.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3 [&>button]:w-full sm:[&>button]:w-auto">
            <Button variant="secondary">Mark as important</Button>
            <Button variant="soft">This is normal</Button>
            <Button variant="ghost">Dismiss alert</Button>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
