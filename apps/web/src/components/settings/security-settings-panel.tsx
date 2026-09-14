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
import { CheckCircle2, Eye, EyeOff, KeyRound, MailCheck, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { authQueryKey, changePasswordWithOtp, requestPasswordChangeOtp } from '@/lib/auth/client';
import { sanitizePasswordInput } from '@/lib/auth/input';
import { getPasswordStrength } from '@/lib/auth/password-strength';
import { cn } from '@/lib/utils';

type DeliveryHint = 'smtp' | 'log';
type SecurityField = 'currentPassword' | 'newPassword' | 'confirmPassword' | 'code';

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

const initialSecurityValues: SecurityValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  code: '',
};

const sanitizeCodeInput = (value: string) =>
  value.replace(/\D/g, '').slice(0, AUTH_EMAIL_VERIFICATION_CODE_LENGTH);

const maskEmail = (email?: string) => {
  if (!email) return 'your registered email';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  if (localPart.length <= 2) return `${localPart[0] ?? ''}***@${domain}`;
  return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`;
};

const validateNewPassword = (password: string) => {
  if (!password) return 'Please create a new password.';
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
      if (!codeRequested) return '';
      if (!values.code) return 'Enter the verification code sent to your email.';
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

export function SecuritySettingsPanel({ user }: { user: UserProfile | null | undefined }) {
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

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
            ? 'Email delivery is in local development mode: verification code printed to the API terminal.'
            : `A ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code was sent to ${maskedEmail}.`,
      });
    } catch (error) {
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to send a password change code right now.',
      );
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
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to update your password right now.',
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Password Change Form */}
      <SurfaceCard className="rounded-[32px] p-6 sm:p-8 md:p-10 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-brand/10 text-brand sm:h-16 sm:w-16 sm:rounded-[24px]">
            <KeyRound className="h-7 w-7" />
          </div>
          <div>
            <p className="kicker">Sign-in Protection</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Change Account Password
            </h2>
            <p className="mt-1.5 text-xs text-ink-soft sm:text-sm leading-relaxed">
              Confirm your existing password, then verify with a one-time code sent to{' '}
              <span className="font-semibold text-ink">{maskedEmail}</span>.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-7 sm:space-y-8">
          {/* Current Password Field */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-ink sm:text-sm" htmlFor="current-password">
              Current password
            </label>
            <div className="relative">
              <Input
                autoComplete="current-password"
                className={cn(
                  'h-14 sm:h-15 rounded-[22px] bg-paper px-5 sm:px-6 pr-13 text-sm sm:text-base transition-all',
                  errors.currentPassword && 'border-danger focus:border-danger',
                )}
                id="current-password"
                onChange={(event) => setFieldValue('currentPassword', event.target.value)}
                placeholder="Enter current password"
                type={showCurrent ? 'text' : 'password'}
                value={values.currentPassword}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4.5 sm:right-5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink focus:outline-none"
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.currentPassword ? (
              <p className="text-xs text-danger font-medium">{errors.currentPassword}</p>
            ) : null}
          </div>

          {/* New Password Field */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-ink sm:text-sm" htmlFor="new-password">
              New password
            </label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className={cn(
                  'h-14 sm:h-15 rounded-[22px] bg-paper px-5 sm:px-6 pr-13 text-sm sm:text-base transition-all',
                  errors.newPassword && 'border-danger focus:border-danger',
                )}
                id="new-password"
                onChange={(event) => setFieldValue('newPassword', event.target.value)}
                placeholder="Create a strong password"
                type={showNew ? 'text' : 'password'}
                value={values.newPassword}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4.5 sm:right-5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink focus:outline-none"
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.newPassword ? (
              <p className="text-xs text-danger font-medium">{errors.newPassword}</p>
            ) : null}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-ink sm:text-sm" htmlFor="confirm-password">
              Confirm new password
            </label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className={cn(
                  'h-14 sm:h-15 rounded-[22px] bg-paper px-5 sm:px-6 pr-13 text-sm sm:text-base transition-all',
                  errors.confirmPassword && 'border-danger focus:border-danger',
                )}
                id="confirm-password"
                onChange={(event) => setFieldValue('confirmPassword', event.target.value)}
                placeholder="Re-enter new password"
                type={showConfirm ? 'text' : 'password'}
                value={values.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4.5 sm:right-5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink focus:outline-none"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="text-xs text-danger font-medium">{errors.confirmPassword}</p>
            ) : null}
          </div>
        </div>

        {/* Password Strength Checklist */}
        <div className="mt-8 rounded-[24px] border border-line bg-paper/70 p-6 sm:p-7">
          <ProgressBar
            helper={passwordStrength.label}
            label="Password strength"
            status={passwordStrength.status}
            value={passwordStrength.progress}
          />
          <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {passwordStrength.checklist.map((item) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-2.5 text-xs sm:text-sm font-medium',
                  item.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink-soft',
                )}
              >
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 shrink-0',
                    item.passed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-300 dark:text-slate-600',
                  )}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* OTP Code Step */}
        {codeRequested ? (
          <div className="mt-7 rounded-[26px] border border-brand/20 bg-brand/5 p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-paper text-brand shadow-xs">
                  <MailCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink sm:text-base">
                    Enter Verification OTP Code
                  </p>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed sm:text-sm">
                    {deliveryHint === 'log'
                      ? 'Local development mode: code printed to API console.'
                      : `A ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit code was dispatched to ${maskedEmail}.`}
                  </p>
                </div>
              </div>

              <Button
                className="shrink-0 gap-2 rounded-[18px] px-4 py-2"
                disabled={isResendingCode || isUpdatingPassword}
                onClick={() => requestOtp(true)}
                size="sm"
                type="button"
                variant="soft"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isResendingCode && 'animate-spin')} />
                <span>{isResendingCode ? 'Sending...' : 'Resend code'}</span>
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              <Input
                autoComplete="one-time-code"
                className={cn(
                  'h-15 rounded-[22px] bg-paper text-center font-mono text-xl tracking-[0.4em]',
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
              {errors.code ? (
                <p className="text-xs text-danger font-medium">{errors.code}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {formError ? (
          <div className="mt-6 rounded-[22px] border border-danger/20 bg-danger/10 p-4.5 text-xs font-semibold text-danger sm:text-sm">
            {formError}
          </div>
        ) : null}

        {notice ? (
          <div
            className={cn(
              'mt-6 rounded-[22px] p-4.5 text-xs font-semibold sm:text-sm',
              notice.tone === 'success'
                ? 'border border-brand/20 bg-brand/10 text-brand-strong'
                : 'border border-line bg-paper text-ink',
            )}
          >
            {notice.message}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col-reverse gap-3 pt-4 border-t border-line sm:flex-row [&>button]:w-full sm:[&>button]:w-auto">
          {codeRequested ? (
            <>
              <Button
                disabled={isUpdatingPassword || isSendingCode || !user?.email}
                onClick={handleChangePassword}
                variant="secondary"
                className="rounded-[18px] px-7 h-13 text-sm font-bold"
              >
                {isUpdatingPassword ? 'Updating password...' : 'Verify OTP & Update Password'}
              </Button>
              <Button
                disabled={isUpdatingPassword || isSendingCode || isResendingCode}
                onClick={clearFlow}
                variant="soft"
                className="rounded-[18px] px-6 h-13 text-sm font-semibold"
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
                className="rounded-[18px] px-7 h-13 text-sm font-bold"
              >
                {isSendingCode ? 'Sending verification code...' : 'Request Verification Code'}
              </Button>
              <Button
                disabled={isSendingCode}
                onClick={clearFlow}
                variant="soft"
                className="rounded-[18px] px-6 h-13 text-sm font-semibold"
              >
                Clear
              </Button>
            </>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
