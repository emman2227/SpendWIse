'use client';

import { AUTH_LOGIN_PASSWORD_MIN_LENGTH, authEmailPattern } from '@spendwise/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FocusEvent, type FormEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authQueryKey, getAuthErrorMessage, loginWithCredentials } from '@/lib/auth/client';
import { INACTIVITY_TIMEOUT_MINUTES } from '@/lib/auth/constants';
import { sanitizeEmailInput, sanitizePasswordInput } from '@/lib/auth/input';
import { cn } from '@/lib/utils';

type LoginField = 'email' | 'password';

type LoginValues = Record<LoginField, string>;
type LoginErrors = Partial<Record<LoginField, string>>;
type LoginTouched = Record<LoginField, boolean>;

const initialValues: LoginValues = {
  email: '',
  password: '',
};

const initialTouched: LoginTouched = {
  email: false,
  password: false,
};

const validateField = (field: LoginField, values: LoginValues) => {
  switch (field) {
    case 'email':
      if (!values.email) {
        return 'Please enter your email address.';
      }

      return authEmailPattern.test(values.email)
        ? ''
        : 'Use a valid email address without spaces or emoji.';
    case 'password':
      if (!values.password) {
        return 'Please enter your password.';
      }

      return values.password.length >= AUTH_LOGIN_PASSWORD_MIN_LENGTH
        ? ''
        : `Password must be at least ${AUTH_LOGIN_PASSWORD_MIN_LENGTH} characters.`;
    default:
      return '';
  }
};

const hasErrors = (errors: LoginErrors) => Object.values(errors).some(Boolean);

const GoogleMark = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.8055 12.2295C21.8055 11.4109 21.7327 10.6234 21.5973 9.86719H12V13.8054H17.4836C17.2473 15.0782 16.5291 16.1566 15.4509 16.8817V19.4359H18.7418C20.6673 17.6621 21.8055 15.0491 21.8055 12.2295Z"
      fill="#4285F4"
    />
    <path
      d="M12 22.1823C14.751 22.1823 17.0574 21.2705 18.7419 19.435L15.451 16.8808C14.5392 17.4917 13.3728 17.8551 12 17.8551C9.34638 17.8551C7.09823 16.0627 6.29783 13.6543H2.89514V16.2912C4.57054 19.6211 8.01452 22.1823 12 22.1823Z"
      fill="#34A853"
    />
    <path
      d="M6.29777 13.6534C6.09418 13.0425 5.97839 12.3916 5.97839 11.7217C5.97839 11.0518 6.09418 10.4009 6.29777 9.79004V7.15308H2.89508C2.20599 8.52545 1.81567 10.0789 1.81567 11.7217C1.81567 13.3645 2.20599 14.9179 2.89508 16.2903L6.29777 13.6534Z"
      fill="#FBBC04"
    />
    <path
      d="M12 5.58972C13.4982 5.58972 14.8427 6.10421 15.9001 7.11445L18.8163 4.19827C17.0528 2.55551 14.7464 1.26172 12 1.26172C8.01452 1.26172 4.57054 3.82293 2.89514 7.15281L6.29783 9.78977C7.09823 7.38137 9.34638 5.58972 12 5.58972Z"
      fill="#EA4335"
    />
  </svg>
);

const AppleMark = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15.3656 2.5C15.5794 3.51737 15.2373 4.56609 14.7276 5.23239C14.1848 5.9347 13.2638 6.47859 12.3768 6.45073C12.1381 5.48206 12.535 4.45082 13.0457 3.84094C13.6043 3.15454 14.5664 2.61582 15.3656 2.5Z" />
    <path d="M18.4516 12.9028C18.4696 15.365 20.6133 16.1824 20.637 16.1914C20.6207 16.2491 20.2967 17.3636 19.5078 18.514C18.8254 19.5065 18.1179 20.4937 17.0034 20.5141C15.9088 20.5345 15.5588 19.8662 14.3077 19.8662C13.0555 19.8662 12.6661 20.4937 11.6328 20.5345C10.5574 20.5752 9.74006 19.4517 9.0519 18.4645C7.64614 16.425 6.56665 12.7011 8.00861 10.1978C8.72456 8.95559 10.0046 8.17133 11.3919 8.15094C12.4474 8.13055 13.443 8.85735 14.0877 8.85735C14.7314 8.85735 15.9393 7.98396 17.2126 8.11242C17.7456 8.13402 19.2427 8.32613 20.2037 9.73206C20.1268 9.78064 18.4346 10.7656 18.4516 12.9028Z" />
  </svg>
);

export default function LoginPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [values, setValues] = useState<LoginValues>(initialValues);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<LoginTouched>(initialTouched);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const sessionMessage =
    authReason === 'inactive'
      ? `You were logged out after ${INACTIVITY_TIMEOUT_MINUTES} minutes of inactivity.`
      : authReason === 'expired'
        ? 'Your session expired. Sign in again to continue.'
        : authReason === 'password-reset'
          ? 'Your password was updated. Sign in with your new password.'
          : '';
  const showVerificationLink = formError.toLowerCase().includes('verify your email');

  useEffect(() => {
    setAuthReason(new URLSearchParams(window.location.search).get('reason'));
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as LoginField;
    const sanitizedValue =
      field === 'email'
        ? sanitizeEmailInput(event.target.value)
        : sanitizePasswordInput(event.target.value);
    const nextValues = {
      ...values,
      [field]: sanitizedValue,
    };

    setValues(nextValues);
    setFormError('');
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: touched[field] ? validateField(field, nextValues) : currentErrors[field],
    }));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const field = event.target.name as LoginField;

    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: validateField(field, values),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginErrors = {
      email: validateField('email', values),
      password: validateField('password', values),
    };

    setTouched({
      email: true,
      password: true,
    });
    setErrors(nextErrors);
    setFormError('');

    if (hasErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await loginWithCredentials(values);

      queryClient.setQueryData(authQueryKey, user);
      router.replace('/dashboard');
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to log in right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#f4efe7_100%)] px-3 py-3 md:flex md:min-h-screen md:items-center md:px-4 md:py-4 md:overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(18,35,47,0.1)] md:max-h-[calc(100vh-2rem)] lg:grid lg:h-[500px] lg:grid-cols-[0.93fr,0.83fr]">
        <section className="relative overflow-hidden bg-[#dbe6e1] px-5 py-4 md:px-5 md:py-5 lg:min-h-[500px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-4rem] top-[-3rem] h-40 w-48 rounded-full bg-white/26 blur-sm" />
            <div className="absolute right-[8%] top-[10%] h-48 w-48 rounded-full bg-[#efe9d9] opacity-95" />
            <div className="absolute left-[8%] top-[16%] h-60 w-56 rounded-[38%_62%_56%_44%/48%_37%_63%_52%] border border-white/35 bg-white/12" />
            <div className="absolute left-[-6%] bottom-[-10%] h-48 w-56 rounded-[46%_54%_52%_48%/40%_30%_70%_60%] bg-[#f1e4d1]" />
            <div className="absolute right-[-7%] bottom-[-12%] h-56 w-56 rounded-[58%_42%_61%_39%/44%_55%_45%_56%] bg-white/30" />
            <div className="absolute left-[16%] top-[26%] h-36 w-64 rounded-full bg-[linear-gradient(90deg,rgba(18,40,33,0.92),rgba(16,77,72,0.8),rgba(188,220,206,0.2))] opacity-90 blur-[1px]" />
            <div className="absolute left-[24%] top-[34%] h-28 w-48 rounded-full border border-white/35 bg-white/12" />
          </div>

          <div className="relative flex h-full flex-col justify-between">
            <div>
              <Link
                href="/"
                className="text-lg font-extrabold tracking-[-0.04em] text-brand md:text-xl"
              >
                SpendWise
              </Link>

              <div className="mt-5 max-w-[310px] rounded-[22px] border border-white/45 bg-white/52 p-4 shadow-[0_14px_28px_rgba(18,35,47,0.08)] backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">
                    Curated Signal
                  </span>
                </div>
                <p className="mt-3 max-w-[22ch] text-[13px] font-semibold leading-5 text-slate-700">
                  Money clarity is calmer when the signal is designed to feel human.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="mb-5 grid max-w-[280px] grid-cols-[1.15fr,0.85fr] gap-3">
                <div className="rounded-[22px] border border-white/35 bg-white/28 p-4 backdrop-blur">
                  <div className="h-20 rounded-[18px] bg-[linear-gradient(135deg,rgba(17,39,32,0.88),rgba(16,105,93,0.72),rgba(255,255,255,0.18))]" />
                  <div className="mt-3 h-2 w-20 rounded-full bg-slate-700/20" />
                  <div className="mt-2 h-2 w-14 rounded-full bg-slate-700/10" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-[20px] border border-white/35 bg-[#f4eddf] p-3">
                    <div className="h-10 rounded-[14px] bg-[linear-gradient(135deg,rgba(15,123,113,0.2),rgba(255,255,255,0.6))]" />
                  </div>
                  <div className="rounded-[20px] border border-white/35 bg-white/32 p-3 backdrop-blur">
                    <div className="h-3 w-12 rounded-full bg-brand/25" />
                    <div className="mt-2 h-2 w-16 rounded-full bg-slate-700/10" />
                  </div>
                </div>
              </div>

              <div className="max-w-[295px]">
                <h1
                  className="text-[1.95rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#13281f] md:text-[2.2rem]"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  Financial intelligence, <span className="text-brand">refined.</span>
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto bg-white px-5 pb-6 pt-4 md:px-5 md:pb-7 md:pt-5">
          <div className="mx-auto flex h-full max-w-[360px] flex-col">
            <div className="space-y-2">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.55rem]">
                Welcome Back
              </h2>
              <p className="text-[13px] leading-5 text-slate-500">
                Log in to access your dashboard, insights, and premium planning tools.
              </p>
            </div>

            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#ebe6df] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand/30 hover:text-brand"
                type="button"
              >
                <GoogleMark className="h-4 w-4 shrink-0" />
                Google
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#ebe6df] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand/30 hover:text-brand"
                type="button"
              >
                <AppleMark className="h-3.5 w-3.5 shrink-0 text-slate-900" />
                Apple
              </button>
            </div>

            <div className="mt-3.5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              <span className="h-px flex-1 bg-[#ece7df]" />
              Or email
              <span className="h-px flex-1 bg-[#ece7df]" />
            </div>

            {sessionMessage ? (
              <div className="mt-3.5 rounded-[16px] border border-brand/15 bg-brand/10 px-4 py-3 text-[12px] text-slate-700">
                {sessionMessage}
              </div>
            ) : null}

            <form className="mt-3.5 space-y-3" noValidate onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <Input
                  aria-describedby="email-error"
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  className={cn(
                    'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                    errors.email && 'border-[var(--danger)]',
                  )}
                  disabled={isSubmitting}
                  id="email"
                  name="email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="john@spendwise.com"
                  type="email"
                  value={values.email}
                />
                <p
                  className={cn(
                    'min-h-[0.75rem] text-[10px] leading-4',
                    errors.email ? 'text-[var(--danger)]' : 'text-transparent',
                  )}
                  id="email-error"
                  role="alert"
                >
                  {errors.email ?? ' '}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <label
                    className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link className="text-[11px] font-semibold text-brand" href="/forgot-password">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    aria-describedby="password-error"
                    aria-invalid={Boolean(errors.password)}
                    autoComplete="current-password"
                    className={cn(
                      'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] pr-11 text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                      errors.password && 'border-[var(--danger)]',
                    )}
                    disabled={isSubmitting}
                    id="password"
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700"
                    type="button"
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <p
                  className={cn(
                    'min-h-[0.75rem] text-[10px] leading-4',
                    errors.password ? 'text-[var(--danger)]' : 'text-slate-400',
                  )}
                  id="password-error"
                  role="alert"
                >
                  {errors.password ??
                    `Spaces and emoji are blocked. Use at least ${AUTH_LOGIN_PASSWORD_MIN_LENGTH} characters.`}
                </p>
              </div>

              {formError ? (
                <div className="rounded-[16px] border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-[12px] text-[var(--danger)]">
                  {formError}
                </div>
              ) : null}

              {showVerificationLink ? (
                <div className="rounded-[16px] border border-brand/15 bg-brand/10 px-4 py-3 text-[12px] text-slate-700">
                  <Link
                    className="font-semibold text-brand"
                    href={`/verify-email?email=${encodeURIComponent(values.email)}`}
                  >
                    Enter your verification code
                  </Link>{' '}
                  to finish setting up this account.
                </div>
              ) : null}

              <Button
                className="mt-0.5 h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                disabled={isSubmitting}
                size="lg"
                type="submit"
                variant="secondary"
              >
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </Button>

              <p className="text-center text-[12px] text-slate-500">
                Don&apos;t have an account?{' '}
                <Link className="font-semibold text-brand" href="/register">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
