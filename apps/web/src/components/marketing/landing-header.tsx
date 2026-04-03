import { WalletCards } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface LandingHeaderItem {
  href: string;
  label: string;
}

interface LandingHeaderProps {
  items: LandingHeaderItem[];
}

export const LandingHeader = ({ items }: LandingHeaderProps) => {
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
        </div>
      </div>
    </header>
  );
};
