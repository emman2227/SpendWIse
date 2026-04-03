import { ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { alerts } from '@/lib/demo-data';
import { formatMoney } from '@/lib/formatters';

export default function AnomaliesPage() {
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

      <section className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Alerts list</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Each alert should be reviewable in one pass
          </h2>

          <div className="mt-6 space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{alert.merchant}</p>
                      <p className="text-sm text-slate-500">{alert.category}</p>
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
                <p className="mt-4 text-sm leading-6 text-slate-600">{alert.reason}</p>
                <p className="mt-4 font-semibold text-ink">{formatMoney(alert.amount)}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <p className="kicker">Alert detail</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">{selected.merchant}</h2>
          <p className="mt-2 text-sm text-slate-500">{selected.category} anomaly</p>

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-warning/25 bg-warning/10 px-5 py-5">
              <p className="text-sm font-semibold text-ink">Reason for flagging</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.reason}</p>
            </div>

            <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
              <p className="text-sm font-semibold text-ink">Suggested action</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.suggestedAction}</p>
            </div>

            <div className="rounded-[24px] border border-white/80 bg-sage/30 px-5 py-5">
              <p className="text-sm font-semibold text-ink">Review guidance</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep confirmation controls close to the explanation so users can mark the alert as
                expected or important without hunting for next steps.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary">Mark as important</Button>
            <Button variant="soft">This is normal</Button>
            <Button variant="ghost">Dismiss alert</Button>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
