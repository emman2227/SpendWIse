import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'muted' | 'mint' | 'inverse';
}

const toneClasses: Record<NonNullable<SurfaceCardProps['tone']>, string> = {
  default: 'panel-surface bg-white/90',
  muted: 'panel-surface bg-[var(--surface-muted)]',
  mint: 'panel-surface mint-gradient',
  inverse: 'rounded-[28px] border border-white/10 bg-ink text-white shadow-lift',
};

export const SurfaceCard = ({ className, tone = 'default', ...props }: SurfaceCardProps) => (
  <div className={cn(toneClasses[tone], className)} {...props} />
);
