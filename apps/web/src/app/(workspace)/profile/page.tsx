import { Camera, Mail, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { profileSnapshot } from '@/lib/demo-data';

const profileDetails = [
  { label: 'Display name', value: profileSnapshot.name, icon: UserRound },
  { label: 'Email', value: profileSnapshot.email, icon: Mail },
  { label: 'Location', value: profileSnapshot.location, icon: UserRound },
  { label: 'Currency', value: profileSnapshot.currency, icon: UserRound },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button variant="soft">View security</Button>
            <Button variant="secondary">Edit profile</Button>
          </>
        }
        description="Profile should stay simple, polished, and quietly trustworthy. Keep identity, contact information, and personal preferences close together."
        eyebrow="Profile"
        meta={
          <>
            <Badge variant="neutral">Personal identity area</Badge>
            <Badge variant="info">Premium but low-stress</Badge>
          </>
        }
        title="Manage the account details attached to your workspace."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ink text-2xl font-semibold text-white">
                MT
              </div>
              <button
                className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
                type="button"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-ink">{profileSnapshot.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{profileSnapshot.role}</p>
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
