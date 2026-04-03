import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  label?: string;
  helper?: string;
  size?: 'sm' | 'md';
  status?: 'safe' | 'warning' | 'danger' | 'brand';
}

const statusClasses = {
  safe: 'from-emerald to-brand',
  warning: 'from-warning to-[#e2b871]',
  danger: 'from-danger to-[#e49b8a]',
  brand: 'from-brand to-[#67c4b7]',
} as const;

export const ProgressBar = ({
  value,
  label,
  helper,
  size = 'md',
  status = 'brand',
}: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      {label || helper ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-ink">{label}</span>
          <span className="text-slate-500">{helper}</span>
        </div>
      ) : null}
      <div
        className={cn(
          'overflow-hidden rounded-full bg-slate-200/70',
          size === 'sm' ? 'h-2.5' : 'h-3',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-[width] duration-500',
            statusClasses[status],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
