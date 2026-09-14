'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  AUTH_PHONE_MAX_LENGTH,
  AUTH_PHONE_MIN_LENGTH,
  authNamePattern,
  authPhonePattern,
  getCurrentMonthYear,
  SUPPORTED_CURRENCIES,
} from '@spendwise/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  Coins,
  Copy,
  CreditCard,
  Flag,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Target,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useConfirm } from '@/components/providers/confirm-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  authQueryKey,
  getAuthErrorMessage,
  logoutSession,
  updateProfile,
  useCurrentUserQuery,
} from '@/lib/auth/client';
import {
  getUserInitials,
  INACTIVITY_TIMEOUT_MINUTES,
  LOGOUT_INTENT_STORAGE_KEY,
} from '@/lib/auth/constants';
import { sanitizeNameInput, sanitizePhoneInput } from '@/lib/auth/input';
import { budgetSummaryQueryKey, getBudgetSummary } from '@/lib/budgets/client';
import { goalsQueryKey, listGoals } from '@/lib/goals/client';
import { listExpenses, transactionExpensesQueryKey } from '@/lib/transactions/client';
import { cn } from '@/lib/utils';

const formatDate = (value?: string) => {
  if (!value) return 'Loading...';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Invalid date';
  }
};

const formatFullDate = (value?: string) => {
  if (!value) return 'Loading...';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
    }).format(new Date(value));
  } catch {
    return 'Invalid date';
  }
};

const validateProfileName = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 80) return 'Name must be at most 80 characters.';
  if (!authNamePattern.test(trimmed)) {
    return 'Name can only use letters, spaces, apostrophes, and hyphens.';
  }
  return '';
};

const validateProfilePhone = (phone: string) => {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (!authPhonePattern.test(trimmed)) {
    return `Use a valid phone number with ${AUTH_PHONE_MIN_LENGTH}–${AUTH_PHONE_MAX_LENGTH} digits.`;
  }
  return '';
};

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { confirmLogout } = useConfirm();
  const { data: user, isLoading: isUserLoading } = useCurrentUserQuery();
  const initials = getUserInitials(user?.name);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Quick edit modal state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { month, year } = getCurrentMonthYear();

  // Workspace stats queries connected directly to backend API routes
  const { data: expenses, isLoading: isExpensesLoading } = useQuery({
    queryKey: transactionExpensesQueryKey({}),
    queryFn: () => listExpenses({}),
    staleTime: 60_000,
  });

  const { data: budgetSummary, isLoading: isBudgetsLoading } = useQuery({
    queryKey: budgetSummaryQueryKey(month, year),
    queryFn: () => getBudgetSummary(month, year),
    staleTime: 60_000,
  });

  const { data: goals, isLoading: isGoalsLoading } = useQuery({
    queryKey: goalsQueryKey,
    queryFn: listGoals,
    staleTime: 60_000,
  });

  const openEditModal = () => {
    setEditName(user?.name ?? '');
    setEditPhone(user?.phone ?? '');
    setNameError('');
    setPhoneError('');
    setSaveError('');
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextNameError = validateProfileName(editName);
    const nextPhoneError = validateProfilePhone(editPhone);

    setNameError(nextNameError);
    setPhoneError(nextPhoneError);

    if (nextNameError || nextPhoneError) {
      return;
    }

    const changes: { name?: string; phone?: string } = {};

    if (editName.trim() !== (user?.name ?? '')) {
      changes.name = editName.trim();
    }

    if (editPhone.trim() !== (user?.phone ?? '')) {
      changes.phone = editPhone.trim();
    }

    if (Object.keys(changes).length === 0) {
      setIsEditDialogOpen(false);
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const updated = await updateProfile(changes);
      queryClient.setQueryData(authQueryKey, updated);
      setIsEditDialogOpen(false);
    } catch (error) {
      setSaveError(getAuthErrorMessage(error, 'Unable to update profile. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const currencyConfig = SUPPORTED_CURRENCIES.find((c) => c.code === user?.currency) ?? {
    code: user?.currency ?? 'USD',
    symbol: '$',
    label: 'US Dollar',
  };

  const profileAttributes = [
    {
      label: 'Display name',
      value: user?.name ?? 'Loading...',
      icon: UserRound,
      description: 'Your workspace name',
    },
    {
      label: 'Email address',
      value: user?.email ?? 'Loading...',
      icon: Mail,
      description: user?.emailVerified ? 'Verified account email' : 'Action needed: verify email',
      copyable: Boolean(user?.email),
      copyKey: 'email',
    },
    {
      label: 'Phone number',
      value: user?.phone || 'Not configured',
      icon: Phone,
      description: user?.phone ? 'Linked security phone' : 'Optional contact phone',
    },
    {
      label: 'Default currency',
      value: `${currencyConfig.code} (${currencyConfig.symbol})`,
      subvalue: currencyConfig.label,
      icon: Coins,
      description: 'Primary reporting currency',
    },
    {
      label: 'Member since',
      value: formatDate(user?.createdAt),
      subvalue: user?.createdAt ? formatFullDate(user?.createdAt) : undefined,
      icon: CalendarDays,
      description: 'Registration date',
    },
    {
      label: 'Last updated',
      value: formatDate(user?.updatedAt),
      icon: ShieldCheck,
      description: 'Profile record revision',
    },
  ];

  const shortcuts = [
    {
      title: 'Identity & Details',
      description: 'Update display name and contact phone',
      href: '/settings?tab=account',
      icon: UserRound,
    },
    {
      title: 'Sign-in & Security',
      description: 'Change password and view protections',
      href: '/settings?tab=security',
      icon: Lock,
    },
    {
      title: 'Preferences & Currency',
      description: 'Customize theme and display currency',
      href: '/settings?tab=preferences',
      icon: Sliders,
    },
    {
      title: 'Alerts & Notifications',
      description: 'Configure reminders and digest frequency',
      href: '/settings?tab=notifications',
      icon: BellRing,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex items-center gap-2.5">
            <Button onClick={openEditModal} variant="secondary" className="gap-2">
              <Pencil className="h-4 w-4" />
              <span>Edit profile</span>
            </Button>
          </div>
        }
        description="Your unified SpendWise identity, personal preferences, and workspace presence."
        eyebrow="Profile"
        meta={
          <>
            <Badge variant="neutral">Live account</Badge>
            <Badge variant={user?.emailVerified ? 'success' : 'warning'}>
              {user?.emailVerified ? 'Email verified' : 'Email unverified'}
            </Badge>
            <Badge variant="info">Secure session</Badge>
          </>
        }
        title="Account & Profile Hub"
      />

      {/* Main Identity & Attributes Grid */}
      <section className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
        {/* Hero Identity Card */}
        <SurfaceCard className="relative flex flex-col justify-between overflow-hidden rounded-[28px] p-6 sm:rounded-[32px] sm:p-7">
          {/* Subtle background glow accent */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />

          {/* Upper Hero Info */}
          <div className="relative flex flex-col items-center text-center">
            {/* Avatar with gradient border styling */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-brand-strong to-brand p-[3px] shadow-soft sm:h-28 sm:w-28">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-paper text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {isUserLoading ? <Skeleton className="h-full w-full rounded-full" /> : initials}
              </div>
            </div>

            <div className="mt-4 sm:mt-5">
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {user?.name ?? 'Loading profile...'}
              </h2>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-soft sm:text-sm">
                <span>{user?.email ?? 'Fetching email...'}</span>
                {user?.email && (
                  <button
                    onClick={() => handleCopy(user.email, 'hero-email')}
                    title="Copy email address"
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-paper-strong hover:text-ink focus:outline-none"
                  >
                    {copiedKey === 'hero-email' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Badges and Chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Personal Workspace
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                  user?.emailVerified
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                )}
              >
                {user?.emailVerified ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )}
                {user?.emailVerified ? 'Verified Account' : 'Unverified Email'}
              </span>
            </div>

            {/* Account ID Pill */}
            {user?.id && (
              <div className="mt-5 flex w-full items-center justify-between rounded-[20px] border border-line bg-paper px-4 py-2.5 text-xs text-ink-soft">
                <span className="font-mono text-[11px] text-ink-soft">
                  ID: {user.id.slice(0, 12)}...
                </span>
                <button
                  onClick={() => handleCopy(user.id, 'user-id')}
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-brand hover:underline focus:outline-none"
                >
                  {copiedKey === 'user-id' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Lower Quick Action Controls */}
          <div className="mt-6 border-t border-line/70 pt-5">
            <p className="text-left text-xs font-medium text-ink-soft">Quick account actions</p>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                onClick={openEditModal}
                variant="outline"
                className="h-10.5 w-full justify-between rounded-[16px] text-xs font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5 text-brand" />
                  Edit account info
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-ink-soft" />
              </Button>

              <Link href="/settings?tab=security" className="block w-full">
                <Button
                  variant="outline"
                  className="h-10.5 w-full justify-between rounded-[16px] text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-brand" />
                    Security & sign-in
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-soft" />
                </Button>
              </Link>

              <Button
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                variant="ghost"
                className="h-10.5 w-full justify-start gap-2 rounded-[16px] text-xs font-semibold text-danger hover:bg-danger/10 hover:text-danger"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out of workspace'}</span>
              </Button>
            </div>
          </div>
        </SurfaceCard>

        {/* Detailed Attributes Grid */}
        <SurfaceCard className="rounded-[28px] p-5 sm:rounded-[32px] sm:p-6 md:p-7">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="text-base font-semibold text-ink sm:text-lg">Account details</h3>
              <p className="text-xs text-ink-soft sm:text-sm">
                Personal identity and localized settings
              </p>
            </div>
            <Button
              onClick={openEditModal}
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs text-brand"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-2">
            {profileAttributes.map((item) => {
              const EntryIcon = item.icon;

              return (
                <div
                  key={item.label}
                  className="group relative flex flex-col justify-between rounded-[20px] border border-line bg-paper p-4 transition-all duration-200 hover:border-brand/30 sm:rounded-[24px] sm:p-4.5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <EntryIcon className="h-4.5 w-4.5" />
                      </div>
                      {item.copyable && item.copyKey && user?.email && (
                        <button
                          onClick={() => handleCopy(user.email, item.copyKey!)}
                          title={`Copy ${item.label}`}
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft opacity-70 transition-opacity hover:bg-paper-strong hover:text-ink hover:opacity-100 focus:outline-none"
                        >
                          {copiedKey === item.copyKey ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-xs font-medium text-ink-soft">{item.label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-ink sm:text-base">
                      {item.value}
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-soft/80 sm:text-xs">{item.description}</p>
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      </section>

      {/* Workspace Activity Snapshot */}
      <section>
        <SurfaceCard className="rounded-[28px] p-5 sm:rounded-[32px] sm:p-6 md:p-7">
          <div className="flex flex-col gap-1 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink sm:text-lg">Workspace at a glance</h3>
              <p className="text-xs text-ink-soft sm:text-sm">
                Live metrics summarizing your active tracking and financial records
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {/* Transactions Metric */}
            <Link
              href="/transactions"
              className="group rounded-[22px] border border-line bg-paper p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft sm:rounded-[24px] sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">Transactions Logged</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:text-blue-400">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {isExpensesLoading ? <Skeleton className="h-8 w-16" /> : (expenses?.length ?? 0)}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
                <span>Expenses & entries</span>
                <ArrowRight className="h-3.5 w-3.5 text-brand opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>

            {/* Budgets Metric */}
            <Link
              href="/budgets"
              className="group rounded-[22px] border border-line bg-paper p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft sm:rounded-[24px] sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">Active Budgets</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:text-purple-400">
                  <Target className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {isBudgetsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  (budgetSummary?.items?.length ?? 0)
                )}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
                <span>Monitored categories</span>
                <ArrowRight className="h-3.5 w-3.5 text-brand opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>

            {/* Goals Metric */}
            <Link
              href="/goals"
              className="group rounded-[22px] border border-line bg-paper p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft sm:rounded-[24px] sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">Savings Goals</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:text-emerald-400">
                  <Flag className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {isGoalsLoading ? <Skeleton className="h-8 w-16" /> : (goals?.length ?? 0)}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-soft">
                <span>Financial targets</span>
                <ArrowRight className="h-3.5 w-3.5 text-brand opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          </div>
        </SurfaceCard>
      </section>

      {/* Security Snapshot & Quick Navigation Shortcuts */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        {/* Security Protections Snapshot */}
        <SurfaceCard className="flex flex-col justify-between rounded-[28px] p-5 sm:rounded-[32px] sm:p-6 md:p-7">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink sm:text-lg">
                  Session & security protections
                </h3>
                <p className="text-xs text-ink-soft">Active guardrails protecting your workspace</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-[20px] border border-line bg-paper p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-ink sm:text-sm">
                    Inactivity auto-lock ({INACTIVITY_TIMEOUT_MINUTES} mins)
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Idle sessions automatically terminate to prevent unauthorized workspace access.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[20px] border border-line bg-paper p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-ink sm:text-sm">
                    Rotating cryptographic tokens
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Secure HTTP-only cookies prevent client-side token interception.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[20px] border border-line bg-paper p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-ink sm:text-sm">
                    Email OTP for sensitive actions
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Password updates and security changes require verification codes sent to your
                    inbox.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-2">
            <Link href="/settings?tab=security" className="block w-full">
              <Button variant="outline" className="w-full justify-between">
                <span>Manage security settings</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </SurfaceCard>

        {/* Quick Settings Navigation */}
        <SurfaceCard className="flex flex-col justify-between rounded-[28px] p-5 sm:rounded-[32px] sm:p-6 md:p-7">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-base font-semibold text-ink sm:text-lg">
                  Account settings shortcuts
                </h3>
                <p className="text-xs text-ink-soft">
                  Quick links to configure your account, security, and preferences
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {shortcuts.map((shortcut) => {
                const Icon = shortcut.icon;

                return (
                  <Link
                    key={shortcut.title}
                    href={shortcut.href}
                    className="group flex flex-col justify-between rounded-[20px] border border-line bg-paper p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
                  >
                    <div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-ink group-hover:text-brand">
                        {shortcut.title}
                      </h4>
                      <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                        {shortcut.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand">
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-2">
            <Link href="/settings" className="block w-full">
              <Button variant="secondary" className="w-full justify-between">
                <span>Go to full settings</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </SurfaceCard>
      </section>

      {/* Edit Profile Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-line bg-surface p-6 shadow-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <Dialog.Title className="text-lg font-bold text-ink sm:text-xl">
                  Edit Profile Details
                </Dialog.Title>
                <Dialog.Description className="text-xs text-ink-soft sm:text-sm">
                  Update your public name and contact phone number.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-full p-1.5 text-ink-soft hover:bg-paper hover:text-ink focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink sm:text-sm" htmlFor="edit-name">
                  Display name
                </label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => {
                    setEditName(sanitizeNameInput(e.target.value));
                    setNameError('');
                    setSaveError('');
                  }}
                  placeholder="Enter your name"
                  className={cn(
                    'h-12 rounded-[18px] bg-paper text-sm',
                    nameError && 'border-danger focus:border-danger',
                  )}
                />
                {nameError && <p className="text-xs text-danger">{nameError}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink sm:text-sm" htmlFor="edit-phone">
                  Phone number
                </label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(sanitizePhoneInput(e.target.value));
                    setPhoneError('');
                    setSaveError('');
                  }}
                  placeholder="+1234567890"
                  className={cn(
                    'h-12 rounded-[18px] bg-paper text-sm',
                    phoneError && 'border-danger focus:border-danger',
                  )}
                />
                {phoneError && <p className="text-xs text-danger">{phoneError}</p>}
              </div>

              <div className="rounded-[18px] border border-line bg-paper p-3.5">
                <p className="text-xs font-medium text-ink-soft">Registered email</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{user?.email}</p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  To change email or password, please use the Security settings panel.
                </p>
              </div>

              {saveError && (
                <div className="rounded-[16px] border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                  {saveError}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" disabled={isSaving}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" variant="secondary" disabled={isSaving}>
                  {isSaving ? 'Saving changes...' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
