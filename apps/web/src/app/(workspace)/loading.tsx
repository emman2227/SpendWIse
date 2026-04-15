import { LoadingIndicatorBar } from '@/components/ui/loading-indicator-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';

export default function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <LoadingIndicatorBar />

      <SurfaceCard className="rounded-[32px] px-6 py-6">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="mt-5 h-10 w-72 max-w-full rounded-full" />
        <Skeleton className="mt-3 h-4 w-[32rem] max-w-full rounded-full" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[22px] border border-white/80 bg-white/70 px-4 py-4"
            >
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="mt-3 h-7 w-28 rounded-full" />
              <Skeleton className="mt-3 h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SurfaceCard key={index} className="px-6 py-6">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="mt-6 h-10 w-36 rounded-full" />
            <Skeleton className="mt-4 h-4 w-40 rounded-full" />
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SurfaceCard className="px-6 py-6">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="mt-4 h-8 w-56 rounded-full" />
          <Skeleton className="mt-6 h-[240px] w-full rounded-[28px]" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-[22px]" />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="px-6 py-6">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="mt-4 h-8 w-48 rounded-full" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[24px] border border-white/80 bg-white/72 px-4 py-4"
              >
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="mt-3 h-3 w-full rounded-full" />
                <Skeleton className="mt-2 h-3 w-4/5 rounded-full" />
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
