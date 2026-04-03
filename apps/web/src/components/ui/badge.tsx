import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.02em]',
  {
    variants: {
      variant: {
        neutral: 'bg-white/70 text-slate-700',
        info: 'bg-brand/10 text-brand',
        success: 'bg-emerald/10 text-emerald',
        warning: 'bg-warning/15 text-warning',
        danger: 'bg-danger/10 text-danger',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
