import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
}

export const StatCard = ({ label, value, detail, icon }: StatCardProps) => {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {icon ? <div className="text-teal-700">{icon}</div> : null}
      </div>
      <p className="text-3xl font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </article>
  );
};
