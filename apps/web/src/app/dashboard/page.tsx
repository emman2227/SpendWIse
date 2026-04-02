import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf4] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <DashboardShell />
      </div>
    </main>
  );
}
