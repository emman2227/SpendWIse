import './globals.css';

import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { QueryProvider } from '@/components/providers/query-provider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'SpendWise',
    template: '%s | SpendWise',
  },
  description:
    'SpendWise is a premium AI-powered personal finance tracker for budgets, insights, anomaly alerts, and forecasting.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${jakarta.variable} ${fraunces.variable} min-h-screen bg-[var(--bg)] text-[var(--ink)]`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
