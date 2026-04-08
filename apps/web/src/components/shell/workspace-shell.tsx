'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Bell, CreditCard, LifeBuoy, LogOut, Plus, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import { authQueryKey, logoutSession, useCurrentUserQuery } from '@/lib/auth/client';
import { getUserInitials, LOGOUT_INTENT_STORAGE_KEY } from '@/lib/auth/constants';
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

const truncateProfileText = (value: string | undefined, maxLength: number, fallback: string) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return fallback;
  }

  return normalizedValue.length > maxLength
    ? `${normalizedValue.slice(0, maxLength).trimEnd()}.....`
    : normalizedValue;
};

const desktopNavigationSections = [
  {
    title: 'Main',
    items: [
      ...primaryNavigation.filter((item) =>
        ['/dashboard', '/transactions', '/budgets'].includes(item.href),
      ),
      ...secondaryNavigation.filter((item) => item.href === '/categories'),
    ],
  },
  {
    title: 'Intelligence',
    items: primaryNavigation.filter((item) =>
      ['/insights', '/forecasts', '/reports'].includes(item.href),
    ),
  },
  {
    title: 'Workspace',
    items: [
      ...primaryNavigation.filter((item) => ['/recurring', '/goals'].includes(item.href)),
      ...secondaryNavigation.filter((item) =>
        ['/anomalies', '/notifications', '/profile', '/settings', '/help'].includes(item.href),
      ),
    ],
  },
];

const desktopNavigationItemClasses = (active: boolean) =>
  cn(
    'group flex items-center gap-2.5 rounded-[14px] px-2.5 py-2 text-[14px] font-medium leading-4 transition-all duration-200',
    active
      ? 'bg-gradient-to-r from-brand/10 to-white text-ink shadow-sm'
      : 'text-slate-600 hover:bg-white/70 hover:text-ink',
  );

export const WorkspaceShell = ({ children }: WorkspaceShellProps) => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: user } = useCurrentUserQuery();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const initials = getUserInitials(user?.name);
  const profileName = truncateProfileText(user?.name, 20, 'Loading profile');
  const profileEmail = truncateProfileText(user?.email, 28, 'Secure workspace');

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logoutSession();
    } finally {
      window.sessionStorage.setItem(LOGOUT_INTENT_STORAGE_KEY, 'manual');
      queryClient.setQueryData(authQueryKey, null);
      router.replace('/login');
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-[color:var(--line-strong)] bg-[rgba(255,253,250,0.96)] text-ink backdrop-blur-xl lg:flex">
        <div className="sidebar-scroll flex h-full flex-col overflow-y-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-brand to-[#52c6ab] text-white shadow-[0_14px_32px_rgba(15,123,113,0.18)]">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold tracking-tight text-ink">
                SpendWise
              </p>
            </div>
          </Link>

          {desktopNavigationSections.map((section) => (
            <div key={section.title} className="mt-5 first:mt-7">
              <p className="px-2.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                {section.title}
              </p>
              <nav className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const active = isPathActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={desktopNavigationItemClasses(active)}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-brand' : 'text-slate-500 group-hover:text-brand',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          <div className="mt-auto pt-4">
            <div className="rounded-[20px] border border-white/80 bg-gradient-to-br from-mint to-white px-3.5 py-3.5 shadow-soft">
              <Badge variant="info" className="px-2 py-1 text-[10px]">
                AI pulse
              </Badge>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">
                SpendWise is monitoring budgets, recurring charges, and unusual shopping patterns.
              </p>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="mt-2.5 h-8 w-full px-3 text-[11.5px]"
              >
                <Link href="/insights">
                  <Sparkles className="h-3.5 w-3.5" />
                  Review insights
                </Link>
              </Button>
            </div>

            <Button
              className="mt-3 h-10 w-full justify-start rounded-[18px] px-3 text-[13px]"
              disabled={isLoggingOut}
              variant="outline"
              onClick={() => {
                void handleLogout();
              }}
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </Button>
          </div>
        </div>
      </aside>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] px-4 pb-24 pt-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:pl-6">
          <header className="sticky top-4 z-30 overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(227,239,234,0.42))] px-4 py-3 shadow-[0_24px_60px_rgba(16,28,45,0.1)] backdrop-blur-2xl md:px-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.78),transparent_42%),linear-gradient(120deg,rgba(255,255,255,0.18),rgba(214,232,225,0.08))]" />
            <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-[18px] bg-ink px-4 py-3 text-sm font-semibold text-white lg:hidden"
                >
                  SpendWise
                </Link>
                <div className="relative hidden min-w-0 flex-1 md:block md:max-w-[420px] lg:max-w-[520px]">
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

              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 self-end md:self-auto">
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
                  className="hidden min-w-0 max-w-full items-center gap-3 rounded-full border border-white/70 bg-white/75 px-3 py-2 shadow-sm sm:flex sm:max-w-[220px] lg:max-w-[260px] xl:max-w-[320px]"
                  title={user?.name && user?.email ? `${user.name} (${user.email})` : undefined}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{profileName}</p>
                    <p className="truncate text-xs text-slate-500">{profileEmail}</p>
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
