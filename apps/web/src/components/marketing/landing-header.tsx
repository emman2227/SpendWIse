'use client';

import { Menu, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AppLogo } from '@/components/ui/app-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LandingHeaderItem {
  href: string;
  label: string;
}

interface LandingHeaderProps {
  items: LandingHeaderItem[];
}

export const LandingHeader = ({ items }: LandingHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-paper-strong/85 backdrop-blur-2xl">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-3.5 py-3 sm:px-6">
        <Link
          className="flex items-center gap-2 transition-transform hover:scale-[1.02] sm:gap-2.5"
          href="/"
        >
          <AppLogo size={30} className="rounded-[8px] shadow-sm sm:h-8 sm:w-8" priority />
          <span className="text-[1.05rem] font-bold tracking-tight text-ink sm:text-[1.24rem]">
            SpendWise
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:gap-7 md:flex">
          {items.map((item) => (
            <a
              key={item.href}
              className="text-xs lg:text-sm font-medium text-ink-soft transition-colors hover:text-brand"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <Button
            asChild
            className="hidden md:inline-flex text-sm font-semibold"
            size="sm"
            variant="ghost"
          >
            <Link href="/login">Log In</Link>
          </Button>
          <Button
            asChild
            className="h-9 px-3 text-xs font-semibold sm:h-9.5 sm:px-5 sm:text-sm shadow-sm shadow-brand/20 whitespace-nowrap"
            variant="secondary"
          >
            <Link href="/register">
              <Sparkles className="h-3.5 w-3.5 mr-1 shrink-0" />
              <span>
                Get Started<span className="hidden sm:inline"> Free</span>
              </span>
            </Link>
          </Button>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-[12px] border border-line bg-paper text-ink-soft transition hover:text-ink md:hidden active:scale-95"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 top-[57px] -z-10 bg-black/20 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          'overflow-hidden border-t border-line/50 bg-paper-strong/98 backdrop-blur-2xl transition-all duration-300 md:hidden',
          mobileMenuOpen
            ? 'max-h-[28rem] opacity-100 shadow-xl'
            : 'max-h-0 opacity-0 pointer-events-none',
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {items.map((item) => (
            <a
              key={item.href}
              className="flex min-h-[44px] items-center rounded-[14px] px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink active:bg-surface-muted"
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-2 pt-2 border-t border-line/60 flex flex-col gap-2">
            <Link
              className="flex min-h-[44px] items-center rounded-[14px] px-3.5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10 active:bg-brand/15"
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              className="flex min-h-[44px] items-center justify-center rounded-[14px] bg-brand px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm active:bg-brand-strong"
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};
