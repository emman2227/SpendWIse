'use client';

import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <SurfaceCard className="rounded-[32px] px-8 py-10">
      <p className="kicker">Something went off pace</p>
      <h1 className="mt-4 text-3xl font-semibold text-ink">
        We could not load this workspace view.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        This error state keeps the tone calm, explains what happened, and gives the user a direct
        recovery action without losing trust.
      </p>
      <Button className="mt-6" onClick={reset} variant="secondary">
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </SurfaceCard>
  );
}
