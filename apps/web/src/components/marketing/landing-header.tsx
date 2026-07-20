'use client';

import { Menu, WalletCards, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-[rgba(248,245,237,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 md:px-6 md:py-2.5">
        <Link className="flex items-center gap-2" href="/">
          <div className="flex h-7 w-7 items-center justify-center rounded-[12px] bg-brand text-white shadow-sm">
            <WalletCards className="h-3 w-3" />
          </div>
          <span className="text-[1.08rem] font-semibold tracking-tight text-ink md:text-[1.2rem]">
            SpendWise
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {items.map((item) => (
            <a
              key={item.href}
              className="text-[0.86rem] font-medium text-slate-500 transition-colors hover:text-ink"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Button asChild className="hidden md:inline-flex" size="sm" variant="ghost">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="h-9.5 px-4 text-[0.86rem] md:px-4.5" variant="secondary">
            <Link href="/register">Get Started</Link>
          </Button>
          <button
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-line bg-white/80 text-slate-600 transition hover:text-ink md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'overflow-hidden border-t border-line/50 bg-[rgba(248,245,237,0.98)] transition-all duration-300 md:hidden',
          mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {items.map((item) => (
            <a
              key={item.href}
              className="rounded-[14px] px-3 py-2.5 text-[0.92rem] font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-ink"
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link
            className="mt-1 rounded-[14px] px-3 py-2.5 text-[0.92rem] font-medium text-brand transition-colors hover:bg-brand/10"
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
          >
            Log In
          </Link>
        </nav>
      </div>
    </header>
  );
};
