import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('skeleton-shimmer rounded-[18px] bg-slate-200/80', className)} {...props} />
  );
};
