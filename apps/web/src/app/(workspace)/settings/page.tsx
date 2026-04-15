'use client';

import {
  AUTH_EMAIL_VERIFICATION_CODE_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  authPasswordLowercasePattern,
  authPasswordNumberPattern,
  authPasswordSpecialCharacterPattern,
  authPasswordUppercasePattern,
  type UserProfile,
} from '@spendwise/shared';
import { useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  BellRing,
  CheckCircle2,
  Download,
  EyeOff,
  Globe2,
  Lock,
  MailCheck,
  Palette,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  authQueryKey,
  changePasswordWithOtp,
  requestPasswordChangeOtp,
  useCurrentUserQuery,
} from '@/lib/auth/client';
import { sanitizePasswordInput } from '@/lib/auth/input';
import { getPasswordStrength } from '@/lib/auth/password-strength';
import {
  defaultNotificationPreferences,
  type NotificationPreferenceKey,
  notificationPreferenceOptions,
  type NotificationPreferences,
  notificationPreferencesChangedEvent,
  notificationPreferencesStorageKey,
  parseNotificationPreferences,
} from '@/lib/notifications/preferences';
import { cn } from '@/lib/utils';

type SettingsTabId = 'account' | 'security' | 'notifications' | 'preferences' | 'privacy';
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
    description: 'Profile details, workspace defaults, and identity settings.',
    icon: UserRound,
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
    id: 'preferences',
    label: 'Preferences',
    description: 'Appearance, locale, and workspace behavior.',
    icon: SlidersHorizontal,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Data sharing, exports, and destructive actions.',
    icon: Lock,
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

function ToggleRow({
  label,
  description,
  enabled = false,
}: {
  label: string;
  description: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-white/80 bg-white/80 px-4 py-4">
      <div className="max-w-[85%]">
        <p className="font-medium text-ink">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <div
        className={cn(
          'flex h-7 w-12 items-center rounded-full p-1 transition-colors',
          enabled ? 'bg-brand' : 'bg-slate-300',
        )}
      >
        <div
          className={cn(
            'h-5 w-5 rounded-full bg-white transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </div>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionVariant = 'soft',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionVariant?: 'secondary' | 'soft' | 'outline' | 'danger';
}) {
  return (
    <SurfaceCard className="rounded-[30px] px-6 py-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      {actionLabel ? (
        <Button className="mt-5" variant={actionVariant}>
          {actionLabel}
        </Button>
      ) : null}
    </SurfaceCard>
  );
}

function AccountPanel({ user }: { user: UserProfile | null | undefined }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="kicker">Account</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Identity and workspace basics</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            { label: 'Display name', value: user?.name ?? 'Loading...' },
            { label: 'Email address', value: user?.email ?? 'Loading...' },
            { label: 'Default landing page', value: 'Dashboard overview' },
            { label: 'Budget role', value: 'Primary household owner' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-5"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <ToggleRow
            description="Show a more personal welcome state across the dashboard and reports."
            enabled
            label="Use full name in workspace greetings"
          />
          <ToggleRow
            description="Keep your most-used views and filters ready when you return."
            enabled
            label="Restore previous workspace session"
          />
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <DetailCard
          actionLabel="Review profile"
          description="Keep profile details aligned with the account people recognize in shared budgeting spaces."
          icon={UserRound}
          title="Profile visibility"
        />
        <DetailCard
          actionLabel="Change defaults"
          description="Choose the page, density, and summary style that should greet you every day."
          icon={SlidersHorizontal}
          title="Workspace defaults"
        />
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
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
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
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Confirm your current password first, then we&apos;ll send a one-time code to{' '}
              <span className="font-semibold text-ink">{maskedEmail}</span> before the change is
              saved.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink" htmlFor="current-password">
              Current password
            </label>
            <Input
              autoComplete="current-password"
              className={cn(
                'h-14 rounded-[24px] bg-white/90',
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
                'h-14 rounded-[24px] bg-white/90',
                errors.newPassword && 'border-danger focus:border-danger',
              )}
              id="new-password"
              onChange={(event) => setFieldValue('newPassword', event.target.value)}
              placeholder="Create a stronger password"
              type="password"
              value={values.newPassword}
            />
            {errors.newPassword ? (
              <p className="text-sm text-danger">{errors.newPassword}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink" htmlFor="confirm-password">
              Confirm new password
            </label>
            <Input
              autoComplete="new-password"
              className={cn(
                'h-14 rounded-[24px] bg-white/90',
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

        <div className="mt-6 rounded-[24px] border border-white/80 bg-white/80 px-5 py-5">
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
                  item.passed ? 'text-emerald-700' : 'text-slate-500',
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
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/90 text-brand shadow-soft">
                  <MailCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Enter your email verification code
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
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
                  'h-14 rounded-[24px] bg-white/95 text-center font-mono text-lg tracking-[0.42em]',
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
                ? 'border border-brand/15 bg-brand/10 text-slate-700'
                : 'border border-white/70 bg-white/80 text-slate-700',
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

      <div className="space-y-6">
        <DetailCard
          actionLabel="Manage sessions"
          description="Password updates sign you out on this device and force other sessions to refresh before they can continue."
          icon={Smartphone}
          title="Device sessions"
        />
        <DetailCard
          actionLabel="Set up recovery"
          description="Keep recovery methods current so legitimate lockouts stay low-stress and fast to resolve."
          icon={Lock}
          title="Recovery methods"
        />
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences,
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPreferences(
      parseNotificationPreferences(window.localStorage.getItem(notificationPreferencesStorageKey)),
    );
  }, []);

  const persistPreferences = (nextPreferences: NotificationPreferences, nextMessage: string) => {
    setPreferences(nextPreferences);
    setMessage(nextMessage);
    window.localStorage.setItem(notificationPreferencesStorageKey, JSON.stringify(nextPreferences));
    window.dispatchEvent(new Event(notificationPreferencesChangedEvent));
  };

  const setPreference = (key: NotificationPreferenceKey, enabled: boolean) => {
    persistPreferences(
      {
        ...preferences,
        [key]: enabled,
      },
      `${enabled ? 'Enabled' : 'Paused'} ${notificationPreferenceOptions.find((item) => item.key === key)?.label.toLowerCase()}.`,
    );
  };

  const setAllPreferences = (enabled: boolean) => {
    persistPreferences(
      Object.fromEntries(
        notificationPreferenceOptions.map((option) => [option.key, enabled]),
      ) as NotificationPreferences,
      enabled ? 'All notification channels enabled.' : 'All notification channels paused.',
    );
  };

  const resetPreferences = () => {
    persistPreferences(defaultNotificationPreferences, 'Notification settings reset to default.');
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
                <p className="kicker">Notifications</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Choose what reaches you</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              These controls affect the notification bell in the header. Keep only the reminders you
              want active.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Active channels</p>
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
            disabled={allChannelsEnabled}
            onClick={() => setAllPreferences(true)}
            size="sm"
            variant="secondary"
          >
            Enable all
          </Button>
          <Button
            disabled={allChannelsPaused}
            onClick={() => setAllPreferences(false)}
            size="sm"
            variant="soft"
          >
            Pause all
          </Button>
          <Button onClick={resetPreferences} size="sm" variant="outline">
            Reset defaults
          </Button>
        </div>

        {message ? (
          <div className="mt-4 rounded-[18px] border border-brand/15 bg-brand/10 px-4 py-3 text-sm text-slate-700">
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
                  : 'border-line bg-white/80 hover:border-brand/20',
              )}
              key={option.key}
              onClick={() => setPreference(option.key, !enabled)}
              type="button"
            >
              <span className="min-w-0">
                <span className="font-semibold text-ink">{option.label}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-500">
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
                    'h-5 w-5 rounded-full bg-white transition-transform',
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

function PreferencesPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <p className="kicker">Preferences</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Make the workspace feel like yours
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Warm light',
              description: 'Soft neutrals with gentle contrast',
              selected: true,
            },
            {
              label: 'Focused mint',
              description: 'A calmer accent palette for tracking',
              selected: false,
            },
            {
              label: 'High contrast',
              description: 'Sharper surfaces for dense review work',
              selected: false,
            },
          ].map(({ label, description, selected }) => (
            <div
              key={label}
              className={cn(
                'rounded-[24px] border px-5 py-5 transition-colors',
                selected
                  ? 'border-brand bg-brand/10'
                  : 'border-white/80 bg-white/80 hover:border-brand/30',
              )}
            >
              <p className="font-semibold text-ink">{label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <ToggleRow
            description="Use a tighter card rhythm when you want more information visible at once."
            label="Compact density"
          />
          <ToggleRow
            description="Reduce animation in charts and transitions for a steadier workspace."
            enabled
            label="Gentle motion"
          />
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <DetailCard
          actionLabel="Adjust locale"
          description="Preferred currency is PHP, date format is long-form, and weeks begin on Monday."
          icon={Globe2}
          title="Language and locale"
        />
        <DetailCard
          actionLabel="Update layout"
          description="Control whether reports, dashboards, and category views open with more guidance or more density."
          icon={SlidersHorizontal}
          title="Workspace behavior"
        />
      </div>
    </div>
  );
}

function PrivacyPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <SurfaceCard className="rounded-[32px] px-6 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <EyeOff className="h-5 w-5" />
          </div>
          <div>
            <p className="kicker">Privacy</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Control what is shared and retained
            </h2>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ToggleRow
            description="Keep AI explanations visible only when you explicitly open them."
            enabled
            label="Show explanations on demand"
          />
          <ToggleRow
            description="Hide sensitive category names in dashboard snapshots and print views."
            enabled
            label="Mask private labels in shared views"
          />
          <ToggleRow
            description="Allow product analytics that help improve planning insights over time."
            label="Share anonymous usage data"
          />
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <DetailCard
          actionLabel="Export archive"
          description="Download your transactions, budgets, and supporting records in a portable format."
          icon={Download}
          title="Data export"
        />
        <SurfaceCard className="rounded-[30px] border border-danger/25 bg-danger/10 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger/15 text-danger">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-ink">Delete account</h3>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Destructive actions should stay separated from everyday controls and always explain the
            consequences in plain language.
          </p>
          <Button className="mt-5" variant="danger">
            Review deletion steps
          </Button>
        </SurfaceCard>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('security');
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
    ) : activeTab === 'security' ? (
      <SecurityPanel user={user} />
    ) : activeTab === 'notifications' ? (
      <NotificationsPanel />
    ) : activeTab === 'preferences' ? (
      <PreferencesPanel />
    ) : (
      <PrivacyPanel />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        className="px-6 py-5 md:px-7 md:py-6"
        description="Manage your application preferences with clear sections for account details, security, notifications, workspace behavior, and privacy."
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
                      ? 'bg-white/95 text-ink shadow-soft ring-1 ring-white/80'
                      : 'text-slate-500 hover:bg-white/60 hover:text-ink',
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
