'use client';

import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, LogOut, Menu, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import { authQueryKey, logoutSession, useCurrentUserQuery } from '@/lib/auth/client';
import { getUserInitials, LOGOUT_INTENT_STORAGE_KEY } from '@/lib/auth/constants';
import { mobileNavigation, primaryNavigation, secondaryNavigation } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { useConfirm } from '../providers/confirm-provider';
import { AppLogo } from '../ui/app-logo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LoadingIndicatorBar } from '../ui/loading-indicator-bar';
import { HeaderNotificationModal } from './notification-modal';

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
        ['/anomalies', '/profile', '/settings', '/help'].includes(item.href),
      ),
    ],
  },
];

const desktopNavigationItemClasses = (active: boolean) =>
  cn(
    'group flex items-center gap-2.5 rounded-[14px] px-2.5 py-2 text-[14px] font-medium leading-4 transition-all duration-200',
    active ? 'bg-brand/10 text-ink shadow-sm' : 'text-ink-soft hover:bg-paper hover:text-ink',
  );

export const WorkspaceShell = ({ children }: WorkspaceShellProps) => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const activeFetchCount = useIsFetching();
  const router = useRouter();
  const { data: user } = useCurrentUserQuery();
  const { confirmLogout } = useConfirm();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const initials = getUserInitials(user?.name);
  const profileName = truncateProfileText(user?.name, 20, 'Loading profile');
  const profileEmail = truncateProfileText(user?.email, 28, 'Secure workspace');

  // Close drawer automatically on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileDrawerOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen]);

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (!confirmed) {
      return;
    }

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
      {activeFetchCount > 0 || isLoggingOut ? <LoadingIndicatorBar /> : null}

      {/* Desktop Sidebar (>= 1024px) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line-strong bg-paper-strong text-ink backdrop-blur-xl lg:flex">
        <div className="sidebar-scroll flex h-full flex-col overflow-y-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <AppLogo size={40} className="rounded-[14px]" priority />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold tracking-tight text-ink">
                SpendWise
              </p>
            </div>
          </Link>

          {desktopNavigationSections.map((section) => (
            <div key={section.title} className="mt-5 first:mt-7">
              <p className="px-2.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-ink-soft">
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
                          active ? 'text-brand' : 'text-ink-soft group-hover:text-brand',
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
            <Button
              className="h-10 w-full justify-start rounded-[18px] px-3 text-[13px]"
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

      {/* Mobile Slide-Out Drawer Navigation (< 1024px) */}
      {isMobileDrawerOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 left-0 z-10 flex w-[min(85vw,310px)] max-w-sm flex-col overflow-y-auto border-r border-line bg-paper-strong p-4 shadow-lift transition-transform duration-300 animate-in slide-in-from-left">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-line/70 pb-3.5">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5"
                onClick={() => setIsMobileDrawerOpen(false)}
              >
                <AppLogo size={36} className="rounded-[12px]" priority />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-tight text-ink">SpendWise</p>
                </div>
              </Link>
              <button
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition hover:border-brand/40 hover:text-ink"
                onClick={() => setIsMobileDrawerOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Categorized Nav links */}
            <div className="flex-1 space-y-4 py-3.5">
              {desktopNavigationSections.map((section) => (
                <div key={section.title}>
                  <p className="px-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                    {section.title}
                  </p>
                  <nav className="mt-1.5 space-y-0.5">
                    {section.items.map((item) => {
                      const active = isPathActive(pathname, item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setIsMobileDrawerOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 rounded-[14px] px-3 py-2 text-[13.5px] font-medium transition-colors',
                            active
                              ? 'bg-brand/10 text-brand font-semibold shadow-sm'
                              : 'text-ink-soft hover:bg-paper hover:text-ink',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              active ? 'text-brand' : 'text-ink-soft',
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            {/* User Profile & Logout */}
            <div className="border-t border-line/70 pt-3">
              <Link
                href="/profile"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 rounded-[16px] border border-line bg-paper px-3 py-2 transition hover:border-brand/30"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{profileName}</p>
                  <p className="truncate text-[10.5px] text-ink-soft">{profileEmail}</p>
                </div>
              </Link>

              <Button
                className="mt-2 h-9 w-full justify-start rounded-[14px] px-3 text-xs"
                disabled={isLoggingOut}
                variant="outline"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  void handleLogout();
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] px-3 pb-28 pt-3 sm:px-6 sm:pb-24 sm:pt-4 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6 lg:pl-6">
          <header className="sticky top-2 sm:top-4 z-30 overflow-hidden rounded-[20px] sm:rounded-[28px] border border-line bg-paper/95 px-3 py-2 sm:px-5 sm:py-3 shadow-soft backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--paper-strong),transparent_42%)]" />
            <div className="relative flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                {/* Mobile Menu Hamburger Button */}
                <button
                  aria-label="Open navigation menu"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:border-brand/40 hover:bg-paper-strong active:scale-95 lg:hidden"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  type="button"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:opacity-95 lg:hidden shrink-0 shadow-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                  SpendWise
                </Link>
                <div className="relative hidden min-w-0 flex-1 md:block md:w-[320px] lg:w-[420px] xl:w-[480px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <Input
                    aria-label="Search transactions, budgets, and reports"
                    className="border-line bg-paper pl-11 pr-12 text-sm"
                    placeholder="Search transactions, categories, or reports"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-line bg-paper-strong px-2 py-1 text-[11px] font-semibold text-ink-soft">
                    /
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  aria-label="Toggle search"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition hover:border-brand/40 hover:text-ink md:hidden"
                  onClick={() => setMobileSearchOpen((open) => !open)}
                  type="button"
                >
                  <Search className="h-4 w-4" />
                </button>
                <Button
                  asChild
                  size="sm"
                  variant="soft"
                  className="hidden lg:inline-flex h-9 text-xs"
                >
                  <Link href="/reports">Export report</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="hidden sm:inline-flex h-9 text-xs sm:text-sm px-3.5 rounded-full"
                >
                  <Link href="/transactions">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Add expense</span>
                  </Link>
                </Button>
                <HeaderNotificationModal />
                <Button
                  asChild
                  size="icon"
                  variant="soft"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full"
                >
                  <Link aria-label="Help and support" href="/help">
                    <LifeBuoy className="h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/profile"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-ink text-xs sm:text-sm font-semibold text-white shadow-sm sm:hidden"
                  title={user?.name ?? 'Profile'}
                >
                  {initials}
                </Link>
                <Link
                  href="/profile"
                  className="hidden min-w-0 max-w-full items-center gap-2.5 sm:gap-3 rounded-full border border-line bg-paper px-3 py-1.5 sm:py-2 shadow-sm sm:flex sm:max-w-[200px] lg:max-w-[240px]"
                  title={user?.name && user?.email ? `${user.name} (${user.email})` : undefined}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{profileName}</p>
                    <p className="truncate text-[10.5px] text-ink-soft">{profileEmail}</p>
                  </div>
                </Link>
              </div>
            </div>

            <div
              className={cn(
                'overflow-hidden transition-all duration-200 md:hidden',
                mobileSearchOpen ? 'mt-2.5 max-h-14 opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              <div className="relative pt-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  aria-label="Search transactions, budgets, and reports"
                  className="h-10 rounded-full border-line bg-paper pl-10 text-sm"
                  placeholder="Search transactions or reports..."
                />
              </div>
            </div>
          </header>

          <main className="module-page flex-1">{children}</main>
        </div>
      </div>

      <Link
        href="/transactions"
        className="fixed bottom-20 right-3.5 sm:bottom-24 sm:right-4 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-brand text-white shadow-lift transition active:scale-95 lg:hidden"
        aria-label="Add expense"
      >
        <Plus className="h-5 w-5" />
      </Link>

      <nav className="panel-surface fixed bottom-2.5 sm:bottom-4 left-1/2 z-40 flex w-[min(96vw,460px)] -translate-x-1/2 items-center justify-around px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-[20px] sm:rounded-[26px] shadow-lift backdrop-blur-xl lg:hidden">
        {mobileNavigation.map((item) => {
          const active = isPathActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[46px] sm:min-w-[60px] flex-col items-center gap-0.5 sm:gap-1 rounded-[14px] sm:rounded-[18px] px-1.5 py-1.5 sm:px-2 sm:py-2 text-[10px] sm:text-[11px] font-semibold transition',
                active ? 'bg-brand/10 text-brand' : 'text-ink-soft hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
