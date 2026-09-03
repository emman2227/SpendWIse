import { cn } from '@/lib/utils';

export interface CircularGaugeProps {
  progress: number;
  status: 'safe' | 'warning' | 'danger';
  size?: number;
  className?: string;
}

export function CircularGauge({ progress, status, size = 42, className }: CircularGaugeProps) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const strokeColorClass =
    status === 'danger'
      ? 'stroke-danger'
      : status === 'warning'
        ? 'stroke-warning'
        : 'stroke-brand';

  const textColorClass =
    status === 'danger' ? 'text-danger' : status === 'warning' ? 'text-warning' : 'text-ink';

  return (
    <div
      aria-label={`${Math.round(progress)}% utilized`}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ height: size, width: size }}
    >
      <svg
        className="-rotate-90 transform"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        {/* Background track ring */}
        <circle
          className="stroke-black/5 dark:stroke-white/10"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Dynamic progress ring */}
        <circle
          className={cn('transition-all duration-500 ease-out', strokeColorClass)}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      {/* Center percentage label */}
      <span className={cn('absolute text-[10px] font-bold tracking-tight', textColorClass)}>
        {Math.round(progress)}%
      </span>
    </div>
  );
}
