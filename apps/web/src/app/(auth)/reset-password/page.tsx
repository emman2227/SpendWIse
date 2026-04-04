'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FocusEvent, type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ResetField = 'password' | 'confirmPassword';

type ResetValues = Record<ResetField, string>;
type ResetErrors = Partial<Record<ResetField, string>>;
type ResetTouched = Record<ResetField, boolean>;

const initialValues: ResetValues = {
  password: '',
  confirmPassword: '',
};

const initialTouched: ResetTouched = {
  password: false,
  confirmPassword: false,
};

const numberPattern = /\d/;
const lowerPattern = /[a-z]/;
const upperPattern = /[A-Z]/;

const validateField = (field: ResetField, values: ResetValues) => {
  switch (field) {
    case 'password':
      if (!values.password) return 'Please create a new password.';
      if (values.password.length < 10) return 'Use at least 10 characters.';
      if (!upperPattern.test(values.password) || !lowerPattern.test(values.password)) {
        return 'Include upper and lower case letters.';
      }
      return numberPattern.test(values.password) ? '' : 'Include at least one number.';
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Please confirm your new password.';
      return values.confirmPassword === values.password ? '' : 'Passwords do not match.';
    default:
      return '';
  }
};

const hasErrors = (errors: ResetErrors) => Object.values(errors).some(Boolean);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ResetErrors>({});
  const [touched, setTouched] = useState(initialTouched);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as ResetField;
    const nextValues = {
      ...values,
      [field]: event.target.value,
    };

    setValues(nextValues);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: touched[field] ? validateField(field, nextValues) : currentErrors[field],
      ...(field === 'password' && touched.confirmPassword
        ? { confirmPassword: validateField('confirmPassword', nextValues) }
        : {}),
    }));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const field = event.target.name as ResetField;

    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: validateField(field, values),
      ...(field === 'password' && touched.confirmPassword
        ? { confirmPassword: validateField('confirmPassword', values) }
        : {}),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: ResetErrors = {
      password: validateField('password', values),
      confirmPassword: validateField('confirmPassword', values),
    };

    setTouched({
      password: true,
      confirmPassword: true,
    });
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) return;
    router.push('/login');
  };

  const helperText = errors.password
    ? errors.password
    : 'Use at least 10 characters with upper/lower case and one number.';

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#f4efe7_100%)] px-3 py-3 md:flex md:min-h-screen md:items-center md:px-4 md:py-4 md:overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(18,35,47,0.1)] md:max-h-[calc(100vh-2rem)] lg:grid lg:grid-cols-[0.93fr,0.83fr]">
        <section className="relative overflow-hidden bg-[#d7e1dc] px-5 py-4 md:px-5 md:py-5 lg:min-h-[460px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-8 top-[-1.5rem] h-34 w-44 rounded-full bg-white/26 blur-sm" />
            <div className="absolute right-[10%] top-[12%] h-42 w-42 rounded-full bg-[#f0eadb] opacity-95" />
            <div className="absolute left-[12%] top-[26%] h-8 w-60 rounded-full bg-[linear-gradient(90deg,rgba(16,49,44,0.88),rgba(18,120,110,0.7),rgba(255,255,255,0.08))] blur-[1px]" />
            <div className="absolute left-[10%] bottom-[-12%] h-54 w-56 rounded-[48%_52%_57%_43%/44%_34%_66%_56%] bg-[#f4e6d6]" />
            <div className="absolute right-[-8%] bottom-[-10%] h-48 w-50 rounded-[60%_40%_55%_45%/44%_56%_44%_56%] bg-white/24" />
            <div className="absolute left-[16%] top-[16%] h-24 w-24 rounded-full border border-white/38 bg-white/18" />
            <div className="absolute left-[27%] top-[15%] h-24 w-24 rounded-full border border-white/26 bg-transparent" />
          </div>

          <div className="relative flex h-full flex-col">
            <Link href="/" className="text-lg font-extrabold tracking-[-0.04em] text-brand md:text-xl">
              SpendWise
            </Link>

            <div className="mt-6 max-w-[316px] rounded-[24px] border border-white/40 bg-white/38 p-4 shadow-[0_12px_24px_rgba(18,35,47,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Password Update
                </span>
              </div>
              <p className="mt-3 max-w-[22ch] text-[13px] font-semibold leading-5 text-slate-700">
                Password reset works best when strength guidance feels visible before the final save.
              </p>
            </div>

            <div className="relative mt-auto">
              <div className="mb-5 grid max-w-[300px] grid-cols-[1.08fr,0.92fr] gap-3">
                <div className="rounded-[28px] border border-white/35 bg-white/18 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-[16px] bg-[linear-gradient(145deg,rgba(17,43,38,0.88),rgba(14,110,101,0.68))]" />
                    <div className="h-3 w-14 rounded-full bg-brand/24" />
                  </div>
                  <div className="mt-5 h-16 rounded-[22px] border border-white/35 bg-white/18" />
                  <div className="mt-4 h-2 w-20 rounded-full bg-slate-700/16" />
                  <div className="mt-2 h-2 w-12 rounded-full bg-slate-700/10" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-[24px] border border-white/35 bg-[#f5ece0] p-3">
                    <div className="h-16 rounded-[18px] bg-[linear-gradient(135deg,rgba(15,123,113,0.22),rgba(255,255,255,0.68))]" />
                  </div>
                  <div className="rounded-[20px] border border-white/35 bg-white/28 p-3 backdrop-blur-sm">
                    <div className="h-10 rounded-[14px] bg-[linear-gradient(145deg,rgba(18,44,40,0.82),rgba(18,130,118,0.34),rgba(255,255,255,0.08))]" />
                  </div>
                </div>
              </div>

              <div className="max-w-[320px]">
                <h1
                  className="text-[1.95rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#13281f] md:text-[2.2rem]"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  Choose a stronger password, <span className="text-brand">then continue.</span>
                </h1>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">
                  Good reset design makes strength, confirmation, and the next safe step feel obvious.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-4 md:px-5 md:py-5">
          <div className="mx-auto flex max-w-[360px] flex-col">
            <div className="space-y-2">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.55rem]">
                Choose a New Password
              </h2>
              <p className="text-[13px] leading-5 text-slate-500">
                Enter a stronger password below. We&apos;ll guide you with inline rules before you
                submit.
              </p>
            </div>

            <form className="mt-5 space-y-3" noValidate onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    aria-describedby="new-password-error"
                    aria-invalid={Boolean(errors.password)}
                    autoComplete="new-password"
                    className={cn(
                      'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] pr-11 text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                      errors.password && 'border-[var(--danger)]',
                    )}
                    id="new-password"
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700"
                    type="button"
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p
                  className={cn(
                    'min-h-[0.75rem] text-[10px] leading-4',
                    errors.password ? 'text-[var(--danger)]' : 'text-slate-500',
                  )}
                  id="new-password-error"
                  role="alert"
                >
                  {helperText}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500" htmlFor="confirm-new-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    aria-describedby="confirm-new-password-error"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    autoComplete="new-password"
                    className={cn(
                      'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] pr-11 text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                      errors.confirmPassword && 'border-[var(--danger)]',
                    )}
                    id="confirm-new-password"
                    name="confirmPassword"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Repeat your new password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                  />
                  <button
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700"
                    type="button"
                    onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p
                  className={cn(
                    'min-h-[0.75rem] text-[10px] leading-4',
                    errors.confirmPassword ? 'text-[var(--danger)]' : 'text-transparent',
                  )}
                  id="confirm-new-password-error"
                  role="alert"
                >
                  {errors.confirmPassword ?? ' '}
                </p>
              </div>

              <div className="rounded-[18px] border border-[#ece7df] bg-[#fbf8f2] px-4 py-3 text-[12px] leading-5 text-slate-500">
                Suggested rule set: at least 10 characters, a mix of upper and lower case, and one
                number. Confirmation should appear as soon as both passwords match.
              </div>

              <Button
                className="mt-1 h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                size="lg"
                type="submit"
                variant="secondary"
              >
                Save New Password
              </Button>

              <p className="text-center text-[12px] text-slate-500">
                Need the link again?{' '}
                <Link className="font-semibold text-brand" href="/forgot-password">
                  Resend recovery email
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
