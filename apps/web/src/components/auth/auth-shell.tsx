import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Badge } from '../ui/badge';
import { SurfaceCard } from '../ui/surface-card';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

const trustHighlights = [
  {
    title: 'Private by default',
    description:
      'Security settings, device activity, and data controls stay clear and easy to review.',
    icon: ShieldCheck,
  },
  {
    title: 'Explainable AI',
    description:
      'Insights and alerts include plain-language reasons so recommendations stay trustworthy.',
    icon: Sparkles,
  },
  {
    title: 'Production-ready flow',
    description:
      'Loading, validation, recovery, and success states are part of the experience from the first screen.',
    icon: CheckCircle2,
  },
];

export const AuthShell = ({ eyebrow, title, description, children, footer }: AuthShellProps) => {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="panel-surface-strong hero-gradient relative overflow-hidden px-7 py-8 text-white md:px-10 md:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold"
          >
            SpendWise
          </Link>

          <div className="mt-10 max-w-xl space-y-5">
            <Badge className="bg-white/10 text-white" variant="neutral">
              {eyebrow}
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
            <p className="text-base leading-8 text-white/80">{description}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {trustHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-[24px] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/75">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <SurfaceCard className="rounded-[36px] px-6 py-7 md:px-10 md:py-10">
          {children}
          {footer ? <div className="mt-8 border-t border-line pt-6">{footer}</div> : null}
        </SurfaceCard>
      </div>
    </main>
  );
};
