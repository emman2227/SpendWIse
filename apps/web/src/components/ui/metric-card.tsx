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
  default: 'panel-surface bg-white/90',
  mint: 'panel-surface mint-gradient',
  ink: 'rounded-[28px] border border-white/10 bg-ink text-white shadow-lift',
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
    <article className={cn(toneClasses[tone], 'p-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              tone === 'ink' ? 'text-white/70' : 'text-slate-500',
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'mt-3 text-3xl font-semibold',
              tone === 'ink' ? 'text-white' : 'text-ink',
            )}
          >
            {value}
          </p>
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl',
              tone === 'ink' ? 'bg-white/10 text-white' : 'bg-white text-brand',
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={cn('text-sm', tone === 'ink' ? 'text-white/70' : 'text-slate-500')}>
          {helper}
        </p>
        {delta ? <Badge variant={tone === 'ink' ? 'neutral' : 'info'}>{delta}</Badge> : null}
      </div>
    </article>
  );
};
