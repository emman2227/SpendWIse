import { Lock, Shield, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';

const settingGroups = [
  {
    title: 'General',
    items: ['Default start page', 'Compact density', 'Week starts on Monday'],
  },
  {
    title: 'Appearance',
    items: ['Theme placeholder', 'Chart motion level', 'Card contrast'],
  },
  {
    title: 'Currency and locale',
    items: ['Preferred currency', 'Date format', 'Language placeholder'],
  },
  {
    title: 'Notifications',
    items: ['Budget alerts', 'Forecast nudges', 'Recurring reminders'],
  },
  {
    title: 'Privacy',
    items: ['Data usage overview', 'AI explanation visibility', 'Connected data placeholder'],
  },
  {
    title: 'Security',
    items: ['Change password', 'Two-factor placeholder', 'Device sessions'],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">Export data</Button>
            <Button variant="secondary">Save changes</Button>
          </>
        }
        description="Settings should feel grouped, calm, and low-stress. Use clear labels, supportive helper text, and avoid burying important privacy or security controls."
        eyebrow="Settings"
        meta={
          <>
            <Badge variant="neutral">General, privacy, security, data</Badge>
            <Badge variant="info">Grouped cards instead of long forms</Badge>
          </>
        }
        title="Configure how SpendWise looks, behaves, and protects your data."
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <p className="kicker">Setting groups</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Main preferences</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {settingGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
              >
                <p className="font-semibold text-ink">{group.title}</p>
                <div className="mt-3 space-y-3">
                  {group.items.map((item, index) => (
                    <div key={item} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-ink">{item}</p>
                        <p className="text-sm text-slate-500">
                          {index === 0 ? 'Recommended default available' : 'Placeholder control'}
                        </p>
                      </div>
                      <div
                        className={`h-7 w-12 rounded-full p-1 ${
                          index !== 2 ? 'bg-brand' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-full bg-white ${
                            index !== 2 ? 'translate-x-5' : ''
                          }`}
                        />
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
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="kicker">Security actions</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Password and sessions</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {['Change password', 'Manage sessions', 'Delete account placeholder'].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-white/80 bg-white/80 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-ink">{item}</p>
                    <p className="text-sm text-slate-500">Protected confirmation pattern</p>
                  </div>
                  <Button size="sm" variant="soft">
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="kicker">Data and export</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Ownership and control</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
                <p className="font-semibold text-ink">Connected services placeholder</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Reserve space for bank connections or import tools without crowding the core
                  settings experience today.
                </p>
              </div>
              <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-5 py-5">
                <p className="font-semibold text-ink">Delete account</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Destructive actions need confirmation dialogs, plain-language consequences, and a
                  clear path back out.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
