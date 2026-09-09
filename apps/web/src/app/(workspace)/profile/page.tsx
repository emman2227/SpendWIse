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

      <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink text-xl font-semibold text-white sm:h-24 sm:w-24 sm:text-2xl">
              {initials}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-ink sm:mt-5 sm:text-2xl">
              {user?.name ?? 'Loading...'}
            </h2>
            <p className="mt-1 text-xs text-ink-soft sm:mt-2 sm:text-sm">
              {user?.email ?? 'Fetching profile details'}
            </p>

            <div className="mt-5 w-full rounded-[20px] border border-line bg-paper px-4 py-4 text-left sm:mt-6 sm:rounded-[24px] sm:px-5 sm:py-5">
              <p className="text-xs font-semibold text-ink sm:text-sm">Session protections</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft sm:mt-2 sm:text-sm sm:leading-6">
                Access tokens expire automatically, refresh tokens rotate, and inactive sessions
                close after {INACTIVITY_TIMEOUT_MINUTES} minutes.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] px-4 py-5 sm:rounded-[32px] sm:px-6 sm:py-6 md:px-7">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {profileDetails.map((item) => {
              const EntryIcon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-[20px] border border-line bg-paper px-4 py-4 sm:rounded-[24px] sm:px-5 sm:py-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand sm:h-11 sm:w-11">
                    <EntryIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                  <p className="mt-3 text-xs text-ink-soft sm:mt-4 sm:text-sm">{item.label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-ink sm:mt-2 sm:text-base">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
