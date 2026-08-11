import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Badge } from './badge';

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  delta?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'mint' | 'ink';
  className?: string;
}

const toneClasses = {
  default: 'panel-surface bg-paper',
  mint: 'panel-surface mint-gradient',
  ink: 'rounded-[28px] border border-line bg-ink text-white shadow-lift',
} as const;

export const MetricCard = ({
  label,
  value,
  helper,
  delta,
  icon: Icon,
  tone = 'default',
  className,
}: MetricCardProps) => {
  return (
    <article
      className={cn(toneClasses[tone], 'module-card-enter relative overflow-hidden p-6', className)}
    >
      {Icon ? (
        <div
          className={cn(
            'absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl',
            tone === 'ink' ? 'bg-paper text-white' : 'bg-paper-strong text-brand',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}

      <div className={cn('min-w-0', Icon ? 'pr-16' : undefined)}>
        <div className="min-w-0">
          <p
            className={cn(
              'text-sm font-medium',
              tone === 'ink' ? 'text-white/70' : 'text-ink-soft',
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'mt-3 text-2xl font-semibold sm:text-3xl',
              tone === 'ink' ? 'text-white' : 'text-ink',
            )}
          >
            {value}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p
          className={cn(
            'min-w-0 truncate text-sm',
            tone === 'ink' ? 'text-white/70' : 'text-ink-soft',
          )}
        >
          {helper}
        </p>
        {delta ? <Badge variant={tone === 'ink' ? 'neutral' : 'info'}>{delta}</Badge> : null}
      </div>
    </article>
  );
};
