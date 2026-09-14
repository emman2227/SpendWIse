'use client';

import {
  AUTH_PHONE_MAX_LENGTH,
  AUTH_PHONE_MIN_LENGTH,
  authNamePattern,
  authPhonePattern,
  type UserProfile,
} from '@spendwise/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  Copy,
  LogOut,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useConfirm } from '@/components/providers/confirm-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  authQueryKey,
  getAuthErrorMessage,
  logoutSession,
  resendVerificationCode,
  updateProfile,
} from '@/lib/auth/client';
import { getUserInitials, LOGOUT_INTENT_STORAGE_KEY } from '@/lib/auth/constants';
import { sanitizeNameInput, sanitizePhoneInput } from '@/lib/auth/input';
import { cn } from '@/lib/utils';

interface AccountSettingsPanelProps {
  user: UserProfile | null | undefined;
}

const formatMemberSince = (dateString?: string) => {
  if (!dateString) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return null;
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

export function AccountSettingsPanel({ user }: AccountSettingsPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { confirmSave, confirmLogout } = useConfirm();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{
    tone: 'success' | 'info' | 'danger';
    text: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const initials = getUserInitials(user?.name);
  const memberSince = formatMemberSince(user?.createdAt);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((curr) => (curr === key ? null : curr)), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const startEditing = () => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setNameError('');
    setPhoneError('');
    setSaveNotice(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setNameError('');
    setPhoneError('');
  };

  const handleSave = async () => {
    const nextNameError = validateProfileName(name);
    const nextPhoneError = validateProfilePhone(phone);

    setNameError(nextNameError);
    setPhoneError(nextPhoneError);

    if (nextNameError || nextPhoneError) {
      return;
    }

    const changes: { name?: string; phone?: string } = {};

    if (name.trim() !== (user?.name ?? '')) {
      changes.name = name.trim();
    }

    if (phone.trim() !== (user?.phone ?? '')) {
      changes.phone = phone.trim();
    }

    if (!Object.keys(changes).length) {
      setIsEditing(false);
      setSaveNotice({ tone: 'info', text: 'No changes to save.' });
      return;
    }

    const confirmed = await confirmSave({
      title: 'Save profile changes?',
      description: 'Are you sure you want to update your display name and contact phone number?',
      confirmText: 'Save changes',
    });

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setSaveNotice(null);

    try {
      const updated = await updateProfile(changes);
      queryClient.setQueryData(authQueryKey, updated);
      setIsEditing(false);
      setSaveNotice({ tone: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setSaveNotice({
        tone: 'danger',
        text: getAuthErrorMessage(error, 'Unable to save your profile right now.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email || isResendingVerification) return;
    setIsResendingVerification(true);
    setSaveNotice(null);

    try {
      await resendVerificationCode({ email: user.email });
      setSaveNotice({
        tone: 'success',
        text: `Verification code sent to ${user.email}. Check your inbox or terminal.`,
      });
    } catch (error) {
      setSaveNotice({
        tone: 'danger',
        text: getAuthErrorMessage(error, 'Unable to resend verification code.'),
      });
    } finally {
      setIsResendingVerification(false);
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

  return (
    <div className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
      {/* Primary Profile Card */}
      <SurfaceCard className="relative overflow-hidden rounded-[32px] p-6 sm:p-8 md:p-9 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-tr from-brand-strong to-brand p-[2px] text-lg font-bold text-ink shadow-soft sm:h-20 sm:w-20 sm:text-2xl">
              <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-paper">
                {initials}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="kicker">Identity & Account</p>
                <Badge
                  variant={user?.emailVerified ? 'success' : 'warning'}
                  className="text-[10px] py-0.5 px-2.5"
                >
                  {user?.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl">
                {user?.name ?? 'Your Profile'}
              </h2>
            </div>
          </div>

          {!isEditing ? (
            <Button
              onClick={startEditing}
              size="sm"
              variant="soft"
              className="self-start gap-2 sm:self-auto rounded-[18px] px-4 py-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </Button>
          ) : null}
        </div>

        {isEditing ? (
          <div className="mt-8 space-y-6">
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-ink sm:text-sm" htmlFor="profile-name">
                Display name
              </label>
              <Input
                autoComplete="name"
                className={cn(
                  'h-13 rounded-[20px] bg-paper text-sm px-4',
                  nameError && 'border-danger focus:border-danger',
                )}
                id="profile-name"
                onChange={(event) => {
                  setName(sanitizeNameInput(event.target.value));
                  setNameError('');
                }}
                placeholder="Your display name"
                type="text"
                value={name}
              />
              {nameError ? <p className="text-xs text-danger">{nameError}</p> : null}
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-ink sm:text-sm" htmlFor="profile-phone">
                Contact phone number
              </label>
              <Input
                autoComplete="tel"
                className={cn(
                  'h-13 rounded-[20px] bg-paper text-sm px-4',
                  phoneError && 'border-danger focus:border-danger',
                )}
                id="profile-phone"
                inputMode="tel"
                onChange={(event) => {
                  setPhone(sanitizePhoneInput(event.target.value));
                  setPhoneError('');
                }}
                placeholder="+639123456789"
                type="tel"
                value={phone}
              />
              {phoneError ? <p className="text-xs text-danger">{phoneError}</p> : null}
            </div>

            <div className="rounded-[24px] border border-line bg-paper/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-ink-soft">Registered email address</p>
                  <p className="mt-1 font-semibold text-ink sm:text-base">
                    {user?.email ?? 'Loading...'}
                  </p>
                </div>
                <Badge variant="neutral" className="text-[11px]">
                  Primary Login
                </Badge>
              </div>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                Email addresses are bound to your secure authentication credentials and cannot be
                changed directly.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row [&>button]:w-full sm:[&>button]:w-auto">
              <Button
                disabled={isSaving}
                onClick={handleSave}
                variant="secondary"
                className="rounded-[18px] px-6 h-12"
              >
                {isSaving ? 'Saving changes...' : 'Save changes'}
              </Button>
              <Button
                disabled={isSaving}
                onClick={cancelEditing}
                variant="soft"
                className="rounded-[18px] px-5 h-12"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">
            <div className="rounded-[24px] border border-line bg-paper p-5 sm:p-6">
              <div className="flex items-center gap-2.5 text-ink-soft">
                <UserRound className="h-4 w-4 text-brand" />
                <p className="text-xs font-medium">Display name</p>
              </div>
              <p className="mt-3 text-base font-semibold text-ink sm:text-lg">
                {user?.name ?? 'Loading...'}
              </p>
            </div>

            <div className="rounded-[24px] border border-line bg-paper p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-ink-soft">
                  <Mail className="h-4 w-4 text-brand" />
                  <p className="text-xs font-medium">Email address</p>
                </div>
                {user?.email && (
                  <button
                    onClick={() => handleCopy(user.email, 'email')}
                    className="text-ink-soft hover:text-ink focus:outline-none"
                    title="Copy email"
                    type="button"
                  >
                    {copiedKey === 'email' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
              <p className="mt-3 break-all text-base font-semibold text-ink sm:text-lg">
                {user?.email ?? 'Loading...'}
              </p>
            </div>

            <div className="rounded-[24px] border border-line bg-paper p-5 sm:p-6">
              <div className="flex items-center gap-2.5 text-ink-soft">
                <Phone className="h-4 w-4 text-brand" />
                <p className="text-xs font-medium">Phone number</p>
              </div>
              <p className="mt-3 text-base font-semibold text-ink sm:text-lg">
                {user?.phone || 'Not configured'}
              </p>
            </div>

            <div
              className={cn(
                'flex flex-col justify-between rounded-[24px] border p-5 sm:p-6 transition-colors',
                user?.emailVerified
                  ? 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                  : 'border-amber-200/80 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/20',
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  {user?.emailVerified ? (
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <p className="text-xs font-medium text-ink-soft">Verification status</p>
                </div>
                <p
                  className={cn(
                    'mt-3 text-base font-semibold sm:text-lg',
                    user?.emailVerified
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400',
                  )}
                >
                  {user?.emailVerified ? 'Email verified' : 'Pending email verification'}
                </p>
              </div>

              {!user?.emailVerified && (
                <div className="mt-4">
                  <Button
                    disabled={isResendingVerification}
                    onClick={handleResendVerification}
                    size="sm"
                    variant="soft"
                    className="h-9 text-xs gap-1.5 rounded-[16px] px-3.5"
                  >
                    <RefreshCw
                      className={cn('h-3 w-3', isResendingVerification && 'animate-spin')}
                    />
                    <span>
                      {isResendingVerification ? 'Sending...' : 'Send verification email'}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {saveNotice ? (
          <div
            className={cn(
              'mt-6 rounded-[22px] p-4 text-xs font-medium sm:text-sm',
              saveNotice.tone === 'success' &&
                'border border-brand/20 bg-brand/10 text-brand-strong',
              saveNotice.tone === 'danger' && 'border border-danger/20 bg-danger/10 text-danger',
              saveNotice.tone === 'info' && 'border border-line bg-paper text-ink',
            )}
          >
            {saveNotice.text}
          </div>
        ) : null}
      </SurfaceCard>

      {/* Side Meta & Session Card */}
      <div className="space-y-6 sm:space-y-8">
        {/* Account Meta Card */}
        <SurfaceCard className="rounded-[32px] p-6 sm:p-7 shadow-soft">
          <h3 className="text-sm font-bold text-ink">Workspace Account Info</h3>
          <div className="mt-5 space-y-4">
            {user?.id && (
              <div className="flex items-center justify-between rounded-[20px] border border-line bg-paper p-4 text-xs">
                <span className="font-mono text-ink-soft">ID: {user.id.slice(0, 14)}...</span>
                <button
                  onClick={() => handleCopy(user.id, 'acc-id')}
                  className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                  type="button"
                >
                  {copiedKey === 'acc-id' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {memberSince && (
              <div className="flex items-center gap-3.5 rounded-[20px] border border-line bg-paper p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-ink-soft">Registered on</p>
                  <p className="text-xs font-semibold text-ink sm:text-sm">{memberSince}</p>
                </div>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* Sign Out Card */}
        <SurfaceCard className="rounded-[32px] p-6 sm:p-7 shadow-soft">
          <h3 className="text-base font-bold text-ink">Active Session</h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft sm:text-sm sm:leading-6">
            End your current session securely on this device. You will need to authenticate again to
            access your workspace.
          </p>
          <Button
            className="mt-5 w-full gap-2 rounded-[20px] h-12 sm:w-auto px-6"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            variant="outline"
          >
            <LogOut className="h-4 w-4 text-ink-soft" />
            <span>{isLoggingOut ? 'Signing out...' : 'Sign out of workspace'}</span>
          </Button>
        </SurfaceCard>
      </div>
    </div>
  );
}
