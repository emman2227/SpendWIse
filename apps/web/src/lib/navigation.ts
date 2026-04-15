import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ChartColumnIncreasing,
  CircleHelp,
  CreditCard,
  Flag,
  LayoutDashboard,
  Receipt,
  Repeat2,
  Settings,
  ShieldAlert,
  Sparkles,
  Tags,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';

export interface NavigationItem {
  href: string;
  label: string;
  shortLabel?: string;
  description: string;
  icon: LucideIcon;
}

export const primaryNavigation: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    description: 'Overview and health snapshot',
    icon: LayoutDashboard,
  },
  {
    href: '/transactions',
    label: 'Transactions',
    shortLabel: 'Spend',
    description: 'Expenses, filters, and details',
    icon: Receipt,
  },
  {
    href: '/budgets',
    label: 'Budgets',
    shortLabel: 'Budgets',
    description: 'Limits and pacing',
    icon: Target,
  },
  {
    href: '/insights',
    label: 'Insights',
    shortLabel: 'AI',
    description: 'Behavior and recommendations',
    icon: Sparkles,
  },
  {
    href: '/forecasts',
    label: 'Forecasts',
    shortLabel: 'Forecast',
    description: 'What next month may look like',
    icon: TrendingUp,
  },
  {
    href: '/reports',
    label: 'Reports',
    shortLabel: 'Reports',
    description: 'Analytics and export',
    icon: ChartColumnIncreasing,
  },
  {
    href: '/recurring',
    label: 'Recurring',
    shortLabel: 'Bills',
    description: 'Subscriptions and bills',
    icon: Repeat2,
  },
  {
    href: '/goals',
    label: 'Goals',
    shortLabel: 'Goals',
    description: 'Savings and milestones',
    icon: Flag,
  },
];

export const secondaryNavigation: NavigationItem[] = [
  {
    href: '/anomalies',
    label: 'Alerts',
    shortLabel: 'Alerts',
    description: 'Unusual and suspicious spend',
    icon: ShieldAlert,
  },
  {
    href: '/categories',
    label: 'Categories',
    shortLabel: 'Tags',
    description: 'Spend taxonomy',
    icon: Tags,
  },
  {
    href: '/profile',
    label: 'Profile',
    shortLabel: 'Profile',
    description: 'Identity and personal details',
    icon: UserRound,
  },
  {
    href: '/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    description: 'Preferences and security',
    icon: Settings,
  },
  {
    href: '/help',
    label: 'Help',
    shortLabel: 'Help',
    description: 'Guidance and support',
    icon: CircleHelp,
  },
];

export const mobileNavigation = [
  primaryNavigation[0],
  primaryNavigation[1],
  primaryNavigation[2],
  primaryNavigation[3],
  secondaryNavigation.find((item) => item.href === '/settings'),
].filter((item): item is NavigationItem => Boolean(item));

export const quickLinks = [
  {
    href: '/transactions',
    label: 'Add expense',
    icon: CreditCard,
  },
  {
    href: '/budgets',
    label: 'Set budget',
    icon: Target,
  },
  {
    href: '/reports',
    label: 'Export report',
    icon: BookOpen,
  },
];
