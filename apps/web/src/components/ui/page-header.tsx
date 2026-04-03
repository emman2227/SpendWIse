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
        'flex flex-col gap-6 rounded-[32px] border border-white/70 bg-white/70 px-6 py-6 shadow-soft backdrop-blur-xl md:px-8 md:py-7',
        className,
      )}
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-4">
          {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-[2.35rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
              {description}
            </p>
          </div>
          {meta ? <div className="flex flex-wrap gap-3">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
};
