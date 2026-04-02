interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
}

export const MetricCard = ({ label, value, helper }: MetricCardProps) => {
  return (
    <article className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
};
