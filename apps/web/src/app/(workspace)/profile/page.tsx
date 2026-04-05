'use client';

import { CalendarDays, Mail, ShieldCheck, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useCurrentUserQuery } from '@/lib/auth/client';
import { getUserInitials, INACTIVITY_TIMEOUT_MINUTES } from '@/lib/auth/constants';

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
      }).format(new Date(value))
    : 'Loading...';

export default function ProfilePage() {
  const { data: user } = useCurrentUserQuery();
  const initials = getUserInitials(user?.name);

  const profileDetails = [
    { label: 'Display name', value: user?.name ?? 'Loading...', icon: UserRound },
    { label: 'Email', value: user?.email ?? 'Loading...', icon: Mail },
    { label: 'Member since', value: formatDate(user?.createdAt), icon: CalendarDays },
    { label: 'Last updated', value: formatDate(user?.updatedAt), icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button variant="soft" disabled>
            Security managed
          </Button>
        }
        description="Your authenticated SpendWise profile is pulled from the live account record, so the header and profile stay in sync across the workspace."
        eyebrow="Profile"
        meta={
          <>
            <Badge variant="neutral">Live account data</Badge>
            <Badge variant="info">Secure session enabled</Badge>
          </>
        }
        title="Manage the account details attached to your workspace."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ink text-2xl font-semibold text-white">
              {initials}
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-ink">{user?.name ?? 'Loading...'}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {user?.email ?? 'Fetching profile details'}
            </p>

            <div className="mt-6 w-full rounded-[24px] border border-white/80 bg-white/80 px-5 py-5 text-left">
              <p className="text-sm font-semibold text-ink">Session protections</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Access tokens expire automatically, refresh tokens rotate, and inactive sessions
                close after {INACTIVITY_TIMEOUT_MINUTES} minutes.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="grid gap-4 md:grid-cols-2">
            {profileDetails.map((item) => {
              const EntryIcon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <EntryIcon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 font-semibold text-ink">{item.value}</p>
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
