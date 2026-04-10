'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BellRing,
  Clock3,
  Download,
  EyeOff,
  Globe2,
  Lock,
  Palette,
  Shield,
  SlidersHorizontal,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { cn } from '@/lib/utils';

type SettingsTabId = 'account' | 'security' | 'notifications' | 'preferences' | 'privacy';

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: LucideIcon;
}

const settingsTabs: SettingsTab[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Profile details, workspace defaults, and identity settings.',
    icon: UserRound,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password, session controls, and sign-in protections.',
    icon: Shield,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alerts, reminders, and digest behavior.',
    icon: BellRing,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Appearance, locale, and workspace behavior.',
    icon: SlidersHorizontal,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Data sharing, exports, and destructive actions.',
    icon: Lock,
  },
];

function ToggleRow({
  label,
  description,
  enabled = false,
}: {
  label: string;
  description: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-white/80 bg-white/80 px-4 py-4">
      <div className="max-w-[85%]">
        <p className="font-medium text-ink">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <div
        className={cn(
          'flex h-7 w-12 items-center rounded-full p-1 transition-colors',
          enabled ? 'bg-brand' : 'bg-slate-300',
        )}
      >
        <div
          className={cn(
            'h-5 w-5 rounded-full bg-white transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </div>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionVariant = 'soft',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionVariant?: 'secondary' | 'soft' | 'outline' | 'danger';
}) {
  return (
    <SurfaceCard className="rounded-[30px] px-6 py-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      {actionLabel ? (
        <Button className="mt-5" variant={actionVariant}>
          {actionLabel}
        </Button>
      ) : null}
    </SurfaceCard>
  );
}

function AccountPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="kicker">Account</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Identity and workspace basics</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            { label: 'Display name', value: 'Shekinah Santos' },
            { label: 'Email address', value: 'shekinah@spendwise.app' },
            { label: 'Default landing page', value: 'Dashboard overview' },
            { label: 'Budget role', value: 'Primary household owner' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <ToggleRow
            description="Show a more personal welcome state across the dashboard and reports."
            enabled
            label="Use full name in workspace greetings"
          />
          <ToggleRow
            description="Keep your most-used views and filters ready when you return."
            enabled
            label="Restore previous workspace session"
          />
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <DetailCard
          actionLabel="Review profile"
          description="Keep profile details aligned with the account people recognize in shared budgeting spaces."
          icon={UserRound}
          title="Profile visibility"
        />
        <DetailCard
          actionLabel="Change defaults"
          description="Choose the page, density, and summary style that should greet you every day."
          icon={SlidersHorizontal}
          title="Workspace defaults"
        />
      </div>
    </div>
  );
}

function SecurityPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="kicker">Security</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Password and sign-in protection
            </h2>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink" htmlFor="current-password">
              Current password
            </label>
            <Input
              id="current-password"
              placeholder="Enter your current password"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink" htmlFor="new-password">
              New password
            </label>
            <Input id="new-password" placeholder="Create a stronger password" type="password" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink" htmlFor="confirm-password">
              Confirm new password
            </label>
            <Input id="confirm-password" placeholder="Re-enter the new password" type="password" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary">Update password</Button>
          <Button variant="soft">Cancel</Button>
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <DetailCard
          actionLabel="Manage sessions"
          description="Three active devices are signed in. Review them regularly and revoke anything unfamiliar."
          icon={Smartphone}
          title="Device sessions"
        />
        <DetailCard
          actionLabel="Set up recovery"
          description="Add backup steps before enabling two-step verification so lockouts stay low-stress."
          icon={Lock}
          title="Recovery methods"
        />
      </div>
    </div>
  );
}

function NotificationsPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <p className="kicker">Notifications</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Alerts that help without overwhelming
            </h2>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ToggleRow
            description="Receive a heads-up before important budgets drift off track."
            enabled
            label="Budget threshold alerts"
          />
          <ToggleRow
            description="Get short reminders when recurring bills or subscriptions are about to land."
            enabled
            label="Recurring payment reminders"
          />
          <ToggleRow
            description="See lightweight nudges when projections show a tighter month ahead."
            label="Forecast watch notifications"
          />
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <DetailCard
          actionLabel="Edit quiet hours"
          description="Pause non-urgent reminders from 9:00 PM to 7:00 AM so the app stays respectful."
          icon={Clock3}
          title="Quiet hours"
        />
        <DetailCard
          actionLabel="Manage digests"
          description="Bundle lower-priority updates into a daily summary instead of sending them one by one."
          icon={BellRing}
          title="Daily digest"
        />
      </div>
    </div>
  );
}

function PreferencesPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <p className="kicker">Preferences</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Make the workspace feel like yours
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Warm light',
              description: 'Soft neutrals with gentle contrast',
              selected: true,
            },
            {
              label: 'Focused mint',
              description: 'A calmer accent palette for tracking',
              selected: false,
            },
            {
              label: 'High contrast',
              description: 'Sharper surfaces for dense review work',
              selected: false,
            },
          ].map(({ label, description, selected }) => (
            <div
              key={label}
              className={cn(
                'rounded-[24px] border px-5 py-5 transition-colors',
                selected
                  ? 'border-brand bg-brand/10'
                  : 'border-white/80 bg-white/80 hover:border-brand/30',
              )}
            >
              <p className="font-semibold text-ink">{label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <ToggleRow
            description="Use a tighter card rhythm when you want more information visible at once."
            label="Compact density"
          />
          <ToggleRow
            description="Reduce animation in charts and transitions for a steadier workspace."
            enabled
            label="Gentle motion"
          />
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <DetailCard
          actionLabel="Adjust locale"
          description="Preferred currency is PHP, date format is long-form, and weeks begin on Monday."
          icon={Globe2}
          title="Language and locale"
        />
        <DetailCard
          actionLabel="Update layout"
          description="Control whether reports, dashboards, and category views open with more guidance or more density."
          icon={SlidersHorizontal}
          title="Workspace behavior"
        />
      </div>
    </div>
  );
}

function PrivacyPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <EyeOff className="h-5 w-5" />
          </div>
          <div>
            <p className="kicker">Privacy</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Control what is shared and retained
            </h2>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ToggleRow
            description="Keep AI explanations visible only when you explicitly open them."
            enabled
            label="Show explanations on demand"
          />
          <ToggleRow
            description="Hide sensitive category names in dashboard snapshots and print views."
            enabled
            label="Mask private labels in shared views"
          />
          <ToggleRow
            description="Allow product analytics that help improve planning insights over time."
            label="Share anonymous usage data"
          />
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <DetailCard
          actionLabel="Export archive"
          description="Download your transactions, budgets, and supporting records in a portable format."
          icon={Download}
          title="Data export"
        />
        <SurfaceCard className="rounded-[30px] border border-danger/25 bg-danger/10 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger/15 text-danger">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-ink">Delete account</h3>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Destructive actions should stay separated from everyday controls and always explain the
            consequences in plain language.
          </p>
          <Button className="mt-5" variant="danger">
            Review deletion steps
          </Button>
        </SurfaceCard>
      </div>
    </div>
  );
}

const tabPanels: Record<SettingsTabId, JSX.Element> = {
  account: <AccountPanel />,
  security: <SecurityPanel />,
  notifications: <NotificationsPanel />,
  preferences: <PreferencesPanel />,
  privacy: <PrivacyPanel />,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('security');

  return (
    <div className="space-y-6">
      <PageHeader
        className="px-6 py-5 md:px-7 md:py-6"
        description="Manage your application preferences with clear sections for account details, security, notifications, workspace behavior, and privacy."
        eyebrow="Settings"
        title="Settings"
      />

      <section className="space-y-6">
        <SurfaceCard tone="mint" className="rounded-[32px] px-3 py-3">
          <div className="flex flex-wrap gap-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;

              return (
                <button
                  aria-pressed={isActive}
                  key={tab.id}
                  className={cn(
                    'group relative flex min-w-[148px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-[20px] px-4 py-3 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-white/95 text-ink shadow-soft ring-1 ring-white/80'
                      : 'text-slate-500 hover:bg-white/60 hover:text-ink',
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-x-5 bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-transparent via-brand/65 to-transparent transition-all duration-200',
                      isActive
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 group-hover:via-brand/45',
                    )}
                  />
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-0 rounded-[20px] transition-opacity duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-white/75 via-white/35 to-transparent opacity-100'
                        : 'bg-gradient-to-r from-white/55 via-white/20 to-transparent opacity-0 group-hover:opacity-100',
                    )}
                  />
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </SurfaceCard>

        {tabPanels[activeTab]}
      </section>
    </div>
  );
}
