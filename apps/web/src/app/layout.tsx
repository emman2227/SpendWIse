import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

import { QueryProvider } from '@/components/providers/query-provider';

export const metadata: Metadata = {
  title: 'SpendWise',
  description: 'AI Spending Behavior Analyzer starter monorepo'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
