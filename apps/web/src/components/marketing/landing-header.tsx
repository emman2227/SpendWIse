'use client';

import { Menu, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-paper-strong/85 backdrop-blur-2xl">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          href="/"
        >
          <AppLogo size={32} className="rounded-[10px] shadow-sm" priority />
          <div className="flex flex-col">
            <span className="text-[1.12rem] font-bold tracking-tight text-ink md:text-[1.24rem]">
              SpendWise
            </span>
          </div>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {items.map((item) => (
            <a
              key={item.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-brand"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
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
            className="h-9.5 px-4 text-xs font-semibold md:text-sm md:px-5 shadow-sm shadow-brand/20"
            variant="secondary"
          >
            <Link href="/register">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Get Started Free
            </Link>
          </Button>
          <button
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-line bg-paper text-ink-soft transition hover:text-ink md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={cn(
          'overflow-hidden border-t border-line/50 bg-paper-strong/98 backdrop-blur-2xl transition-all duration-300 md:hidden',
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {items.map((item) => (
            <a
              key={item.href}
              className="rounded-[14px] px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-2 pt-2 border-t border-line/60 flex flex-col gap-2">
            <Link
              className="rounded-[14px] px-3.5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              className="rounded-[14px] bg-brand px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm"
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
