import { BellRing, CheckCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { notifications } from '@/lib/demo-data';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Notification settings</Button>
            <Button variant="secondary">Mark all read</Button>
          </>
        }
        description="Notifications should be useful, grouped, and low-noise. Make priority obvious without turning the experience into a warning center."
        eyebrow="Notifications"
        meta={
          <>
            <Badge variant="info">Grouped by category</Badge>
            <Badge variant="neutral">Read and unread states</Badge>
          </>
        }
        title="Keep users informed without overwhelming them."
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="kicker">Notification center</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">
                Prioritize the most actionable items first
              </h2>
            </div>
            <BellRing className="h-6 w-6 text-brand" />
          </div>

          <div className="mt-6 space-y-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-[24px] border px-5 py-5 ${
                  item.unread ? 'border-brand/25 bg-brand/5' : 'border-white/80 bg-white/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.unread ? 'bg-brand' : 'bg-slate-300'
                      }`}
                    />
                    <p className="font-semibold text-ink">{item.title}</p>
                  </div>
                  <Badge variant={item.unread ? 'info' : 'neutral'}>{item.category}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
                <p className="mt-3 text-sm text-slate-400">{item.time}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <CheckCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="kicker">Preferences</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Choose what deserves a nudge</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              'Budget warnings',
              'Anomaly alerts',
              'Forecast updates',
              'Recurring reminders',
              'Security notifications',
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-white/80 bg-white/80 px-4 py-4"
              >
                <div>
                  <p className="font-medium text-ink">{item}</p>
                  <p className="text-sm text-slate-500">
                    {index < 3 ? 'Recommended on' : 'Optional'}
                  </p>
                </div>
                <div
                  className={`h-7 w-12 rounded-full p-1 ${
                    index !== 3 ? 'bg-brand' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white ${
                      index !== 3 ? 'translate-x-5' : ''
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
