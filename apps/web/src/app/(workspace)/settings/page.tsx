'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  AUTH_EMAIL_VERIFICATION_CODE_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PHONE_MAX_LENGTH,
  AUTH_PHONE_MIN_LENGTH,
  authNamePattern,
  authPasswordLowercasePattern,
  authPasswordNumberPattern,
  authPasswordSpecialCharacterPattern,
  authPasswordUppercasePattern,
  authPhonePattern,
  SUPPORTED_CURRENCIES,
  type UserProfile,
} from '@spendwise/shared';
import { useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  BellRing,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  LogOut,
  MailCheck,
  Monitor,
  Moon,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sun,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { useConfirm } from '@/components/providers/confirm-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  authQueryKey,
  changePasswordWithOtp,
  logoutSession,
  requestPasswordChangeOtp,
  updateProfile,
  useCurrentUserQuery,
} from '@/lib/auth/client';
import { getUserInitials, LOGOUT_INTENT_STORAGE_KEY } from '@/lib/auth/constants';
import { sanitizeNameInput, sanitizePasswordInput, sanitizePhoneInput } from '@/lib/auth/input';
import { getPasswordStrength } from '@/lib/auth/password-strength';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/lib/notifications/client';
import {
  defaultNotificationPreferences,
  type NotificationPreferenceKey,
  notificationPreferenceOptions,
} from '@/lib/notifications/preferences';
import { cn } from '@/lib/utils';

type SettingsTabId = 'account' | 'preferences' | 'security' | 'notifications' | 'data';
type DeliveryHint = 'smtp' | 'log';
type SecurityField = 'currentPassword' | 'newPassword' | 'confirmPassword' | 'code';

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface SecurityValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  code: string;
}

interface SecurityNotice {
  tone: 'info' | 'success';
  message: string;
}

const settingsTabs: SettingsTab[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Profile details and identity settings.',
    icon: UserRound,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Theme, region, and display settings.',
    icon: Sliders,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password, session controls, and sign-in protections.',
    icon: Shield,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alerts, reminders, and digest behavior.',
    icon: BellRing,
  },
  {
    id: 'data',
    label: 'Data & Privacy',
    description: 'Export your data or delete your account.',
    icon: Database,
  },
];

const isSettingsTabId = (value: string | null): value is SettingsTabId =>
  Boolean(value && settingsTabs.some((tab) => tab.id === value));

const initialSecurityValues: SecurityValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  code: '',
};

const sanitizeCodeInput = (value: string) =>
  value.replace(/\D/g, '').slice(0, AUTH_EMAIL_VERIFICATION_CODE_LENGTH);

const resolveErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const maskEmail = (email?: string) => {
  if (!email) {
    return 'your registered email';
  }

  const [localPart, domain] = email.split('@');

  if (!localPart || !domain) {
    return email;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? ''}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`;
};

const formatMemberSince = (dateString?: string) => {
  if (!dateString) {
    return null;
  }

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

const validateNewPassword = (password: string) => {
  if (!password) {
    return 'Please create a new password.';
  }

  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!authPasswordUppercasePattern.test(password)) {
    return 'Password must include an uppercase letter.';
  }

  if (!authPasswordLowercasePattern.test(password)) {
    return 'Password must include a lowercase letter.';
  }

  if (!authPasswordNumberPattern.test(password)) {
    return 'Password must include a number.';
  }

  if (!authPasswordSpecialCharacterPattern.test(password)) {
    return 'Password must include a special character.';
  }

  return '';
};

const validateSecurityField = (
  field: SecurityField,
  values: SecurityValues,
  codeRequested: boolean,
) => {
  switch (field) {
    case 'currentPassword':
      return values.currentPassword ? '' : 'Please enter your current password.';
    case 'newPassword':
      if (values.newPassword === values.currentPassword && values.newPassword) {
        return 'Choose a new password that is different from your current password.';
      }
      return validateNewPassword(values.newPassword);
    case 'confirmPassword':
      if (!values.confirmPassword) {
        return 'Please confirm your new password.';
      }
      return values.confirmPassword === values.newPassword ? '' : 'Passwords do not match.';
    case 'code':
      if (!codeRequested) {
        return '';
      }
      if (!values.code) {
        return 'Enter the verification code we sent to your email.';
      }
      return values.code.length === AUTH_EMAIL_VERIFICATION_CODE_LENGTH
        ? ''
        : `Enter the ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`;
    default:
      return '';
  }
};

const getSecurityErrors = (values: SecurityValues, codeRequested: boolean) => ({
  currentPassword: validateSecurityField('currentPassword', values, codeRequested),
  newPassword: validateSecurityField('newPassword', values, codeRequested),
  confirmPassword: validateSecurityField('confirmPassword', values, codeRequested),
  code: validateSecurityField('code', values, codeRequested),
});

const validateProfileName = (name: string) => {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'Name is required.';
  }

  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters.';
  }

  if (trimmed.length > 80) {
    return 'Name must be at most 80 characters.';
  }

  if (!authNamePattern.test(trimmed)) {
    return 'Name can only use letters, spaces, apostrophes, and hyphens.';
  }

  return '';
};

const validateProfilePhone = (phone: string) => {
  const trimmed = phone.trim();

  if (!trimmed) {
    return 'Phone number is required.';
  }

  if (!authPhonePattern.test(trimmed)) {
    return `Use a valid phone number with ${AUTH_PHONE_MIN_LENGTH}–${AUTH_PHONE_MAX_LENGTH} digits.`;
  }

  return '';
};

function AccountPanel({ user }: { user: UserProfile | null | undefined }) {
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
  const [saveNotice, setSaveNotice] = useState('');
  const [saveError, setSaveError] = useState('');

  const initials = getUserInitials(user?.name);
  const memberSince = formatMemberSince(user?.createdAt);

  const startEditing = () => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setNameError('');
    setPhoneError('');
    setSaveNotice('');
    setSaveError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setNameError('');
    setPhoneError('');
    setSaveError('');
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

    if (name.trim() !== user?.name) {
      changes.name = name.trim();
    }

    if (phone.trim() !== user?.phone) {
      changes.phone = phone.trim();
    }

    if (!Object.keys(changes).length) {
      setIsEditing(false);
      setSaveNotice('No changes to save.');
      return;
    }

    const confirmed = await confirmSave({
      title: 'Save profile changes?',
      description:
        'Are you sure you want to save the changes to your display name and phone number?',
      confirmText: 'Save changes',
    });

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const updated = await updateProfile(changes);

      queryClient.setQueryData(authQueryKey, updated);
      setIsEditing(false);
      setSaveNotice('Profile updated successfully.');
    } catch (error) {
      setSaveError(resolveErrorMessage(error, 'Unable to save your profile right now.'));
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

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-brand/10 text-xl font-bold text-brand">
              {initials}
            </div>
            <div>
              <p className="kicker">Account</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Your profile</h2>
            </div>
          </div>
          {!isEditing ? (
            <Button onClick={startEditing} size="sm" variant="soft">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          ) : null}
        </div>

        {isEditing ? (
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink" htmlFor="profile-name">
                Display name
              </label>
              <Input
                autoComplete="name"
                className={cn(
                  'h-14 rounded-[24px] bg-paper',
                  nameError && 'border-danger focus:border-danger',
                )}
                id="profile-name"
                onChange={(event) => {
                  const sanitized = sanitizeNameInput(event.target.value);
                  setName(sanitized);
                  setNameError('');
                  setSaveError('');
                }}
                placeholder="Your display name"
                type="text"
                value={name}
              />
              {nameError ? <p className="text-sm text-danger">{nameError}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink" htmlFor="profile-phone">
                Phone number
              </label>
              <Input
                autoComplete="tel"
                className={cn(
                  'h-14 rounded-[24px] bg-paper',
                  phoneError && 'border-danger focus:border-danger',
                )}
                id="profile-phone"
                inputMode="tel"
                onChange={(event) => {
                  const sanitized = sanitizePhoneInput(event.target.value);
                  setPhone(sanitized);
                  setPhoneError('');
                  setSaveError('');
                }}
                placeholder="+639123456789"
                type="tel"
                value={phone}
              />
              {phoneError ? <p className="text-sm text-danger">{phoneError}</p> : null}
            </div>

            <div className="rounded-[24px] border border-line bg-paper px-5 py-5">
              <p className="text-sm text-ink-soft">Email address</p>
              <p className="mt-2 font-semibold text-ink">{user?.email ?? 'Loading...'}</p>
              <p className="mt-1 text-xs text-ink-soft">Email cannot be changed from settings.</p>
            </div>

            {saveError ? (
              <div className="rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {saveError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={isSaving} onClick={handleSave} variant="secondary">
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
              <Button disabled={isSaving} onClick={cancelEditing} variant="soft">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { label: 'Display name', value: user?.name ?? 'Loading...' },
              { label: 'Email address', value: user?.email ?? 'Loading...' },
              {
                label: 'Phone number',
                value: user?.phone ?? 'Not set',
                icon: Phone,
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-[24px] border border-line bg-paper px-5 py-5">
                <p className="text-sm text-ink-soft">{label}</p>
                <p className="mt-2 font-semibold text-ink">{value}</p>
              </div>
            ))}

            <div
              className={cn(
                'flex items-center gap-3 rounded-[24px] border px-5 py-5',
                user?.emailVerified
                  ? 'border-emerald-200/80 bg-emerald-50/60'
                  : 'border-amber-200/80 bg-amber-50/60',
              )}
            >
              {user?.emailVerified ? (
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
              )}
              <div>
                <p className="text-sm text-ink-soft">Email status</p>
                <p
                  className={cn(
                    'mt-1 font-semibold',
                    user?.emailVerified ? 'text-emerald-700' : 'text-amber-700',
                  )}
                >
                  {user?.emailVerified ? 'Verified' : 'Unverified'}
                </p>
              </div>
            </div>
          </div>
        )}

        {saveNotice && !isEditing ? (
          <div className="mt-4 rounded-[18px] border border-brand/15 bg-brand/10 px-4 py-3 text-sm text-ink">
            {saveNotice}
          </div>
        ) : null}
      </SurfaceCard>

      <div className="space-y-6">
        {memberSince ? (
          <SurfaceCard className="rounded-[30px] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-ink-soft">Member since</p>
                <p className="mt-1 text-lg font-semibold text-ink">{memberSince}</p>
              </div>
            </div>
          </SurfaceCard>
        ) : null}

        <SurfaceCard className="rounded-[30px] px-6 py-6">
          <h3 className="text-lg font-semibold text-ink">Sign out</h3>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            End your current session on this device. You&apos;ll need to sign in again to access
            your workspace.
          </p>
          <Button
            className="mt-5"
            disabled={isLoggingOut}
            onClick={() => {
              void handleLogout();
            }}
            variant="outline"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </Button>
        </SurfaceCard>
      </div>
    </div>
  );
}

function SecurityPanel({ user }: { user: UserProfile | null | undefined }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<SecurityValues>(initialSecurityValues);
  const [errors, setErrors] = useState<Partial<Record<SecurityField, string>>>({});
  const [notice, setNotice] = useState<SecurityNotice | null>(null);
  const [formError, setFormError] = useState('');
  const [deliveryHint, setDeliveryHint] = useState<DeliveryHint>('smtp');
  const [codeRequested, setCodeRequested] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const passwordStrength = getPasswordStrength(values.newPassword);
  const maskedEmail = maskEmail(user?.email);
  const memberSince = formatMemberSince(user?.createdAt);

  const setFieldValue = (field: SecurityField, value: string) => {
    const sanitizedValue =
      field === 'code' ? sanitizeCodeInput(value) : sanitizePasswordInput(value);
    const nextValues = { ...values, [field]: sanitizedValue };

    setValues(nextValues);
    setFormError('');
    setNotice(null);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: validateSecurityField(field, nextValues, codeRequested),
      ...(field === 'newPassword'
        ? {
            confirmPassword: validateSecurityField('confirmPassword', nextValues, codeRequested),
          }
        : null),
    }));
  };

  const clearFlow = () => {
    setValues(initialSecurityValues);
    setErrors({});
    setNotice(null);
    setFormError('');
    setCodeRequested(false);
    setDeliveryHint('smtp');
  };

  const runValidation = (needsCode: boolean) => {
    const nextErrors = getSecurityErrors(values, needsCode);

    setErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  };

  const requestOtp = async (isResend = false) => {
    if (!runValidation(false)) {
      return;
    }

    setFormError('');
    setNotice(null);

    if (isResend) {
      setIsResendingCode(true);
    } else {
      setIsSendingCode(true);
    }

    try {
      const result = await requestPasswordChangeOtp({
        currentPassword: values.currentPassword,
      });

      setDeliveryHint(result.verificationDeliveryMethod);
      setCodeRequested(true);
      setNotice({
        tone: 'success',
        message:
          result.verificationDeliveryMethod === 'log'
            ? 'Email delivery is unavailable right now, so the password change code was printed in the API terminal.'
            : `A verification code was sent to ${maskedEmail}.`,
      });
    } catch (error) {
      setFormError(resolveErrorMessage(error, 'Unable to send a password change code right now.'));
    } finally {
      if (isResend) {
        setIsResendingCode(false);
      } else {
        setIsSendingCode(false);
      }
    }
  };

  const handleChangePassword = async () => {
    if (!runValidation(true)) {
      return;
    }

    setFormError('');
    setNotice(null);
    setIsUpdatingPassword(true);

    try {
      await changePasswordWithOtp({
        currentPassword: values.currentPassword,
        code: values.code,
        password: values.newPassword,
      });
      queryClient.setQueryData(authQueryKey, null);
      router.replace('/login?reason=password-changed');
    } catch (error) {
      setFormError(resolveErrorMessage(error, 'Unable to update your password right now.'));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-brand/10 text-brand">
          <Shield className="h-7 w-7" />
        </div>
        <div>
          <p className="kicker">Security</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink md:text-[2.1rem]">
            Password and sign-in protection
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
            Confirm your current password first, then we&apos;ll send a one-time code to{' '}
            <span className="font-semibold text-ink">{maskedEmail}</span> before the change is
            saved.
          </p>
        </div>
      </div>

      {memberSince ? (
        <div className="mt-5 flex items-center gap-2 rounded-[18px] border border-line bg-paper px-4 py-3">
          <Calendar className="h-4 w-4 shrink-0 text-ink-soft" />
          <p className="text-sm text-ink-soft">
            Account created on <span className="font-medium text-ink">{memberSince}</span>
          </p>
        </div>
      ) : null}

      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink" htmlFor="current-password">
            Current password
          </label>
          <Input
            autoComplete="current-password"
            className={cn(
              'h-14 rounded-[24px] bg-paper',
              errors.currentPassword && 'border-danger focus:border-danger',
            )}
            id="current-password"
            onChange={(event) => setFieldValue('currentPassword', event.target.value)}
            placeholder="Enter your current password"
            type="password"
            value={values.currentPassword}
          />
          {errors.currentPassword ? (
            <p className="text-sm text-danger">{errors.currentPassword}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink" htmlFor="new-password">
            New password
          </label>
          <Input
            autoComplete="new-password"
            className={cn(
              'h-14 rounded-[24px] bg-paper',
              errors.newPassword && 'border-danger focus:border-danger',
            )}
            id="new-password"
            onChange={(event) => setFieldValue('newPassword', event.target.value)}
            placeholder="Create a stronger password"
            type="password"
            value={values.newPassword}
          />
          {errors.newPassword ? <p className="text-sm text-danger">{errors.newPassword}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink" htmlFor="confirm-password">
            Confirm new password
          </label>
          <Input
            autoComplete="new-password"
            className={cn(
              'h-14 rounded-[24px] bg-paper',
              errors.confirmPassword && 'border-danger focus:border-danger',
            )}
            id="confirm-password"
            onChange={(event) => setFieldValue('confirmPassword', event.target.value)}
            placeholder="Re-enter the new password"
            type="password"
            value={values.confirmPassword}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-danger">{errors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-line bg-paper px-5 py-5">
        <ProgressBar
          helper={passwordStrength.label}
          label="Password strength"
          status={passwordStrength.status}
          value={passwordStrength.progress}
        />
        <div className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {passwordStrength.checklist.map((item) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-2 text-sm',
                item.passed ? 'text-emerald-700' : 'text-ink-soft',
              )}
            >
              <CheckCircle2
                className={cn(
                  'h-4 w-4 shrink-0',
                  item.passed ? 'text-emerald-600' : 'text-slate-300',
                )}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {codeRequested ? (
        <div className="mt-6 rounded-[26px] border border-brand/15 bg-[linear-gradient(135deg,rgba(214,235,231,0.78),rgba(255,255,255,0.92))] px-5 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-paper text-brand shadow-soft">
                <MailCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Enter your email verification code</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  {deliveryHint === 'log'
                    ? 'SMTP is unavailable right now, so the code was written to the API terminal for local development.'
                    : `We sent a ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit code to ${maskedEmail}.`}
                </p>
              </div>
            </div>
            <Button
              className="shrink-0"
              disabled={isResendingCode || isUpdatingPassword}
              onClick={() => requestOtp(true)}
              size="sm"
              type="button"
              variant="soft"
            >
              <RefreshCw className={cn('h-4 w-4', isResendingCode && 'animate-spin')} />
              {isResendingCode ? 'Sending...' : 'Resend code'}
            </Button>
          </div>

          <div className="mt-5 space-y-2">
            <label className="text-sm font-semibold text-ink" htmlFor="password-change-code">
              Verification code
            </label>
            <Input
              autoComplete="one-time-code"
              className={cn(
                'h-14 rounded-[24px] bg-paper text-center font-mono text-lg tracking-[0.42em]',
                errors.code && 'border-danger focus:border-danger',
              )}
              id="password-change-code"
              inputMode="numeric"
              maxLength={AUTH_EMAIL_VERIFICATION_CODE_LENGTH}
              onChange={(event) => setFieldValue('code', event.target.value)}
              placeholder={'0'.repeat(AUTH_EMAIL_VERIFICATION_CODE_LENGTH)}
              type="text"
              value={values.code}
            />
            {errors.code ? <p className="text-sm text-danger">{errors.code}</p> : null}
          </div>
        </div>
      ) : null}

      {formError ? (
        <div className="mt-6 rounded-[20px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {formError}
        </div>
      ) : null}

      {notice ? (
        <div
          className={cn(
            'mt-6 rounded-[20px] px-4 py-3 text-sm',
            notice.tone === 'success'
              ? 'border border-brand/15 bg-brand/10 text-ink'
              : 'border border-line bg-paper text-ink',
          )}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {codeRequested ? (
          <>
            <Button
              disabled={isUpdatingPassword || isSendingCode || !user?.email}
              onClick={handleChangePassword}
              variant="secondary"
            >
              {isUpdatingPassword ? 'Updating...' : 'Verify code and update'}
            </Button>
            <Button
              disabled={isUpdatingPassword || isSendingCode || isResendingCode}
              onClick={clearFlow}
              variant="soft"
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              disabled={isSendingCode || !user?.email}
              onClick={() => requestOtp(false)}
              variant="secondary"
            >
              {isSendingCode ? 'Sending code...' : 'Send verification code'}
            </Button>
            <Button disabled={isSendingCode} onClick={clearFlow} variant="soft">
              Clear
            </Button>
          </>
        )}
      </div>
    </SurfaceCard>
  );
}

function NotificationsPanel() {
  const { data } = useNotificationPreferences();
  const preferences = data || defaultNotificationPreferences;
  const updatePreferences = useUpdateNotificationPreferences();
  const [message, setMessage] = useState('');

  // Feature is currently paused for development
  const isFeaturePaused = true;

  const setPreference = (key: NotificationPreferenceKey, enabled: boolean) => {
    if (isFeaturePaused) return;
    updatePreferences.mutate({ [key]: enabled });
    setMessage(
      `${enabled ? 'Enabled' : 'Paused'} ${notificationPreferenceOptions.find((item) => item.key === key)?.label.toLowerCase()}.`,
    );
  };

  const setAllPreferences = (enabled: boolean) => {
    if (isFeaturePaused) return;
    updatePreferences.mutate(
      Object.fromEntries(notificationPreferenceOptions.map((option) => [option.key, enabled])),
    );
    setMessage(
      enabled ? 'All notification channels enabled.' : 'All notification channels paused.',
    );
  };

  const resetPreferences = () => {
    if (isFeaturePaused) return;
    updatePreferences.mutate({
      budget: true,
      ai: true,
      forecast: true,
      recurring: true,
      goal: true,
      transaction: true,
    });
    setMessage('Notification settings reset to default.');
  };

  const activeChannelCount = notificationPreferenceOptions.filter(
    (option) => preferences[option.key],
  ).length;
  const allChannelsEnabled = activeChannelCount === notificationPreferenceOptions.length;
  const allChannelsPaused = activeChannelCount === 0;

  return (
    <SurfaceCard className="overflow-hidden rounded-[32px] px-0 py-0">
      <div className="border-b border-line/80 px-6 py-6 md:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="kicker">Notifications</p>
                  <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-soft">
                    Under development.
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Choose what reaches you</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-ink-soft">
              These controls affect the notification bell in the header. Keep only the reminders you
              want active.
            </p>
          </div>

          <div className="rounded-[24px] border border-line bg-paper px-5 py-4 shadow-sm">
            <p className="text-sm font-medium text-ink-soft">Active channels</p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {activeChannelCount}/{notificationPreferenceOptions.length}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              {allChannelsPaused ? 'Paused' : 'Live'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            disabled={allChannelsEnabled || isFeaturePaused}
            onClick={() => setAllPreferences(true)}
            size="sm"
            variant="secondary"
          >
            Enable all
          </Button>
          <Button
            disabled={allChannelsPaused || isFeaturePaused}
            onClick={() => setAllPreferences(false)}
            size="sm"
            variant="soft"
          >
            Pause all
          </Button>
          <Button disabled={isFeaturePaused} onClick={resetPreferences} size="sm" variant="outline">
            Reset defaults
          </Button>
        </div>

        {message ? (
          <div className="mt-4 rounded-[18px] border border-brand/15 bg-brand/10 px-4 py-3 text-sm text-ink">
            {message}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 px-5 py-5 md:grid-cols-2 md:px-6 md:py-6">
        {notificationPreferenceOptions.map((option) => {
          const enabled = preferences[option.key];

          return (
            <button
              aria-pressed={enabled}
              className={cn(
                'flex min-h-[118px] items-start justify-between gap-4 rounded-[24px] border px-5 py-5 text-left transition',
                enabled
                  ? 'border-brand/20 bg-brand/5 shadow-sm'
                  : 'border-line bg-paper hover:border-brand/20',
                isFeaturePaused && 'cursor-not-allowed opacity-60',
              )}
              disabled={isFeaturePaused}
              key={option.key}
              onClick={() => setPreference(option.key, !enabled)}
              type="button"
            >
              <span className="min-w-0">
                <span className="font-semibold text-ink">{option.label}</span>
                <span className="mt-2 block text-sm leading-6 text-ink-soft">
                  {option.description}
                </span>
              </span>
              <span
                className={cn(
                  'flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors',
                  enabled ? 'bg-brand' : 'bg-slate-300',
                )}
              >
                <span
                  className={cn(
                    'h-5 w-5 rounded-full bg-paper-strong transition-transform',
                    enabled ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
    </SurfaceCard>
  );
}

function PreferencesPanel({ user }: { user: UserProfile | null | undefined }) {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { confirmSave } = useConfirm();

  const [currency, setCurrency] = useState(user?.currency ?? 'PHP');
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    if (currency === user?.currency) {
      setSaveNotice('No changes to save.');
      return;
    }

    const confirmed = await confirmSave({
      title: 'Save preferences?',
      description: `Are you sure you want to change your workspace currency to ${currency}?`,
      confirmText: 'Save preferences',
    });

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveNotice('');

    try {
      const updated = await updateProfile({ currency });
      queryClient.setQueryData(authQueryKey, updated);
      setSaveNotice('Preferences updated successfully.');
    } catch (error) {
      setSaveError(resolveErrorMessage(error, 'Unable to save your preferences right now.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-brand/10 text-brand">
          <Sliders className="h-7 w-7" />
        </div>
        <div>
          <p className="kicker">Preferences</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">App experience</h2>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Appearance</h3>
            <p className="text-sm text-ink-soft">Choose how SpendWise looks on this device.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'border-brand bg-brand/10 text-brand ring-1 ring-brand/20'
                      : 'border-line bg-paper text-ink-soft hover:border-brand/30 hover:bg-paper-strong',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Default Currency</h3>
            <p className="text-sm text-ink-soft">
              Used as the primary currency across all your accounts and insights.
            </p>
          </div>
          <div className="max-w-xs space-y-3">
            <select
              className="h-14 w-full appearance-none rounded-[24px] border border-line bg-paper px-5 text-ink outline-none transition focus:border-brand focus:bg-paper-strong"
              onChange={(e) => {
                setCurrency(e.target.value);
                setSaveNotice('');
                setSaveError('');
              }}
              value={currency}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.label} ({c.symbol})
                </option>
              ))}
            </select>

            {saveError && <p className="text-sm text-danger">{saveError}</p>}
            {saveNotice && <p className="text-sm text-brand">{saveNotice}</p>}

            <Button
              disabled={isSaving || currency === user?.currency}
              onClick={handleSave}
              variant="secondary"
            >
              {isSaving ? 'Saving...' : 'Save preferences'}
            </Button>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function DataPrivacyPanel() {
  const [deleteInput, setDeleteInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const data = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        user: { name: 'User', email: 'user@example.com' },
        expenses: [],
        budgets: [],
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spendwise-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }, 1000);
  };

  const handleDelete = () => {
    if (deleteInput !== 'DELETE' || !passwordInput) return;
    setIsDeleting(true);
    setTimeout(() => {
      window.location.href = '/login?reason=account-deleted';
    }, 1500);
  };

  return (
    <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-brand/10 text-brand">
          <Database className="h-7 w-7" />
        </div>
        <div>
          <p className="kicker">Data & Privacy</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Manage your data</h2>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-ink">Export your data</h3>
          <p className="text-sm leading-6 text-ink-soft max-w-xl">
            Download a copy of your personal data, including all budgets, expenses, and goals. The
            file will be in JSON format.
          </p>
          <Button onClick={handleExport} disabled={isExporting} variant="outline" className="mt-2">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Preparing download...' : 'Export my data'}
          </Button>
        </div>

        <hr className="border-line" />

        <div className="space-y-4 rounded-[24px] border border-danger/20 bg-danger/5 px-6 py-6">
          <div>
            <h3 className="text-lg font-semibold text-danger">Delete account</h3>
            <p className="mt-2 text-sm leading-6 text-ink-soft max-w-xl">
              Permanently remove your account and all associated data. This action cannot be undone.
            </p>
          </div>

          <Dialog.Root
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                setDeleteInput('');
                setPasswordInput('');
              }
            }}
          >
            <Dialog.Trigger asChild>
              <Button className="bg-danger text-white hover:bg-danger/90">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete account
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-paper-strong p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-[24px]">
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                  <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-ink">
                    Are you absolutely sure?
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-ink-soft">
                    This action cannot be undone. This will permanently delete your account and
                    remove your data from our servers.
                  </Dialog.Description>
                </div>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink">Enter your password</label>
                    <Input
                      type="password"
                      placeholder="Your current password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="h-12 rounded-[16px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink">Type DELETE to confirm</label>
                    <Input
                      placeholder="DELETE"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      className="h-12 rounded-[16px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Dialog.Close asChild>
                    <Button variant="outline" disabled={isDeleting}>
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={handleDelete}
                    disabled={deleteInput !== 'DELETE' || !passwordInput || isDeleting}
                    className="bg-danger text-white hover:bg-danger/90 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete account permanently'}
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </SurfaceCard>
  );
}
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('account');
  const { data: user } = useCurrentUserQuery();

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');

    if (isSettingsTabId(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, []);

  const activePanel =
    activeTab === 'account' ? (
      <AccountPanel user={user} />
    ) : activeTab === 'preferences' ? (
      <PreferencesPanel user={user} />
    ) : activeTab === 'security' ? (
      <SecurityPanel user={user} />
    ) : activeTab === 'data' ? (
      <DataPrivacyPanel />
    ) : (
      <NotificationsPanel />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        className="px-6 py-5 md:px-7 md:py-6"
        description="Manage your account details, security, and notification preferences."
        eyebrow="Settings"
        title="Settings"
      />

      <section className="space-y-6">
        <SurfaceCard tone="mint" className="rounded-[32px] px-3 py-3">
          <div className="flex flex-wrap gap-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;

              return (
                <button
                  aria-pressed={isActive}
                  key={tab.id}
                  className={cn(
                    'group relative flex min-w-[148px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-[20px] px-4 py-3 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-paper text-ink shadow-soft ring-1 ring-white/80'
                      : 'text-ink-soft hover:bg-paper-strong hover:text-ink',
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-x-5 bottom-1.5 h-[3px] rounded-full bg-gradient-to-r from-transparent via-brand/65 to-transparent transition-all duration-200',
                      isActive
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 group-hover:via-brand/45',
                    )}
                  />
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-0 rounded-[20px] transition-opacity duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-white/75 via-white/35 to-transparent opacity-100'
                        : 'bg-gradient-to-r from-white/55 via-white/20 to-transparent opacity-0 group-hover:opacity-100',
                    )}
                  />
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </SurfaceCard>

        {activePanel}
      </section>
    </div>
  );
}
