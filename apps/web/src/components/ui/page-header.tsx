import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <header
      className={cn(
        'module-card-enter rounded-[28px] sm:rounded-[34px] border border-line bg-paper px-6 py-6 sm:px-8 sm:py-7 md:px-9 md:py-8 shadow-soft backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3 sm:space-y-3.5">
          {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
          <div className="space-y-2 sm:space-y-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-[2.35rem] leading-[1.2]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm sm:text-base leading-relaxed sm:leading-7 text-ink-soft">
              {description}
            </p>
          </div>
          {meta ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1.5 sm:pt-2">
              {meta}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full shrink-0 pt-2 sm:pt-0 lg:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
};
