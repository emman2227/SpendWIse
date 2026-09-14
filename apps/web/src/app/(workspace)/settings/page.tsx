'use client';

import type { LucideIcon } from 'lucide-react';
import { BellRing, Database, Shield, Sliders, UserRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AccountSettingsPanel } from '@/components/settings/account-settings-panel';
import { DataPrivacySettingsPanel } from '@/components/settings/data-privacy-settings-panel';
import { NotificationsSettingsPanel } from '@/components/settings/notifications-settings-panel';
import { PreferencesSettingsPanel } from '@/components/settings/preferences-settings-panel';
import { SecuritySettingsPanel } from '@/components/settings/security-settings-panel';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useCurrentUserQuery } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

type SettingsTabId = 'account' | 'preferences' | 'security' | 'notifications' | 'data';

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  badge?: string;
  description: string;
  icon: LucideIcon;
}

const settingsTabs: SettingsTab[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Profile details and identity settings.',
    icon: UserRound,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Theme, currency units, and localization.',
    icon: Sliders,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password, OTP verification, and session safeguards.',
    icon: Shield,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    badge: 'Live',
    description: 'Realtime alerts and notification channels.',
    icon: BellRing,
  },
  {
    id: 'data',
    label: 'Data & Privacy',
    description: 'Data export, transaction clearing, and account deletion.',
    icon: Database,
  },
];

const isSettingsTabId = (value: string | null): value is SettingsTabId =>
  Boolean(value && settingsTabs.some((tab) => tab.id === value));

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('account');
  const { data: user } = useCurrentUserQuery();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (isSettingsTabId(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tabId);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettingsPanel user={user} />;
      case 'preferences':
        return <PreferencesSettingsPanel user={user} />;
      case 'security':
        return <SecuritySettingsPanel user={user} />;
      case 'notifications':
        return <NotificationsSettingsPanel />;
      case 'data':
        return <DataPrivacySettingsPanel />;
      default:
        return <AccountSettingsPanel user={user} />;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        description="Manage your profile identity, visual theme, security guardrails, alerts, and personal data."
        eyebrow="Configuration"
        meta={
          <>
            <Badge variant="neutral">Settings Hub</Badge>
            <Badge variant={user?.emailVerified ? 'success' : 'warning'}>
              {user?.emailVerified ? 'Email Verified' : 'Email Unverified'}
            </Badge>
            <Badge variant="info">Encrypted Session</Badge>
          </>
        }
        title="Settings"
      />

      <section className="space-y-8">
        {/* Navigation Tabs Bar with enhanced padding */}
        <SurfaceCard
          tone="mint"
          className="rounded-[30px] p-2.5 sm:rounded-[34px] sm:p-3 shadow-soft"
        >
          <div className="flex flex-nowrap gap-2 overflow-x-auto p-1 pb-1.5 sm:flex-wrap sm:gap-2.5 sm:pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;

              return (
                <button
                  aria-pressed={isActive}
                  key={tab.id}
                  className={cn(
                    'group relative flex min-w-[130px] shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-[22px] px-5 py-3.5 text-xs font-bold transition-all duration-200 sm:min-w-[150px] sm:flex-1 sm:text-sm',
                    isActive
                      ? 'bg-paper text-ink shadow-soft ring-1 ring-white/80 dark:ring-white/10'
                      : 'text-ink-soft hover:bg-paper-strong hover:text-ink',
                  )}
                  onClick={() => handleTabChange(tab.id)}
                  type="button"
                >
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-x-5 bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-transparent via-brand to-transparent transition-all duration-200',
                      isActive
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 group-hover:via-brand/50',
                    )}
                  />
                  <Icon
                    className={cn(
                      'relative z-10 h-4.5 w-4.5 transition-transform duration-200',
                      isActive ? 'text-brand scale-110' : 'text-ink-soft group-hover:text-ink',
                    )}
                  />
                  <span className="relative z-10">{tab.label}</span>
                  {tab.badge && (
                    <span className="relative z-10 rounded-full bg-brand/15 px-2 py-0.5 text-[9px] font-bold text-brand">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SurfaceCard>

        {/* Tab Panel Content */}
        <div className="animate-in fade-in-50 duration-200">{renderActivePanel()}</div>
      </section>
    </div>
  );
}
