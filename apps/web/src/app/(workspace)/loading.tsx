import { SurfaceCard } from '@/components/ui/surface-card';

export default function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <SurfaceCard className="rounded-[32px] px-6 py-6">
        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-5 h-10 w-72 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-3 h-4 w-[32rem] max-w-full animate-pulse rounded-full bg-slate-200" />
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SurfaceCard key={index} className="px-6 py-6">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-6 h-10 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-4 w-40 animate-pulse rounded-full bg-slate-200" />
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SurfaceCard className="h-[360px]" />
        <SurfaceCard className="h-[360px]" />
      </div>
    </div>
  );
}
