'use client';

import { Bell, LifeBuoy, Plus, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { mobileNavigation, primaryNavigation, secondaryNavigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface WorkspaceShellProps {
  children: ReactNode;
}

const isPathActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const navigationItemClasses = (active: boolean) =>
  cn(
    'group flex items-start gap-3 rounded-[22px] px-4 py-3 transition-all duration-200',
    active
      ? 'bg-gradient-to-r from-brand/10 to-white text-ink shadow-sm'
      : 'text-slate-600 hover:bg-white/70 hover:text-ink',
  );

export const WorkspaceShell = ({ children }: WorkspaceShellProps) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 pb-24 pt-4 md:px-6 lg:px-8">
        <aside className="panel-surface-strong sticky top-4 hidden h-[calc(100vh-2rem)] w-[286px] shrink-0 flex-col overflow-hidden p-5 lg:flex">
          <Link href="/" className="rounded-[24px] bg-ink px-5 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-white/70">SPENDWISE</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                  Calm control over every peso.
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/75">
              A premium workspace for tracking spend, understanding behavior, and planning what
              comes next.
            </p>
          </Link>

          <div className="mt-7 space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Primary
            </p>
            <nav className="space-y-1">
              {primaryNavigation.map((item) => {
                const active = isPathActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={navigationItemClasses(active)}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors',
                        active
                          ? 'bg-white text-brand'
                          : 'bg-white/70 text-slate-500 group-hover:text-brand',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Workspace
            </p>
            <nav className="space-y-1">
              {secondaryNavigation.map((item) => {
                const active = isPathActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-medium transition-all',
                      active
                        ? 'bg-white text-ink shadow-sm'
                        : 'text-slate-600 hover:bg-white/70 hover:text-ink',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto rounded-[28px] border border-white/80 bg-gradient-to-br from-mint to-white px-5 py-5 shadow-soft">
            <Badge variant="info">AI pulse</Badge>
            <h2 className="mt-4 text-lg font-semibold text-ink">
              SpendWise is monitoring 3 signals today
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              One budget is over plan, one recurring charge is approaching, and shopping behavior
              looks unusual.
            </p>
            <Button asChild size="sm" variant="secondary" className="mt-5 w-full">
              <Link href="/insights">
                <Sparkles className="h-4 w-4" />
                Review insights
              </Link>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="panel-surface sticky top-4 z-30 px-4 py-3 md:px-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-[18px] bg-ink px-4 py-3 text-sm font-semibold text-white lg:hidden"
                >
                  SpendWise
                </Link>
                <div className="relative hidden min-w-[280px] flex-1 md:block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    aria-label="Search transactions, budgets, and reports"
                    className="border-white/80 bg-white/75 pl-11 pr-12"
                    placeholder="Search transactions, categories, or reports"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-line bg-white px-2 py-1 text-[11px] font-semibold text-slate-400">
                    /
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button asChild size="sm" variant="soft" className="hidden sm:inline-flex">
                  <Link href="/reports">Export report</Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/transactions">
                    <Plus className="h-4 w-4" />
                    Add expense
                  </Link>
                </Button>
                <Button asChild size="icon" variant="soft">
                  <Link aria-label="Notifications" href="/notifications">
                    <Bell className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="icon" variant="soft">
                  <Link aria-label="Help and support" href="/help">
                    <LifeBuoy className="h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/profile"
                  className="hidden items-center gap-3 rounded-full border border-white/70 bg-white/75 px-3 py-2 shadow-sm sm:flex"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                    MT
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Maya Tan</p>
                    <p className="text-xs text-slate-500">Personal plan</p>
                  </div>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      <Link
        href="/transactions"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lift lg:hidden"
        aria-label="Add expense"
      >
        <Plus className="h-5 w-5" />
      </Link>

      <nav className="panel-surface fixed bottom-4 left-1/2 z-40 flex w-[min(94vw,460px)] -translate-x-1/2 items-center justify-around px-2 py-2 lg:hidden">
        {mobileNavigation.map((item) => {
          const active = isPathActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold',
                active ? 'bg-brand/10 text-brand' : 'text-slate-500',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
