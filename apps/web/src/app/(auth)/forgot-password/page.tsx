'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FocusEvent, type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type RecoveryValues = {
  email: string;
};

type RecoveryErrors = Partial<Record<keyof RecoveryValues, string>>;
type RecoveryTouched = Record<keyof RecoveryValues, boolean>;

const initialValues: RecoveryValues = {
  email: '',
};

const initialTouched: RecoveryTouched = {
  email: false,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email: string) => {
  const value = email.trim();

  if (!value) {
    return 'Please enter your email address.';
  }

  return emailPattern.test(value) ? '' : 'Please use a valid email address.';
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<RecoveryErrors>({});
  const [touched, setTouched] = useState(initialTouched);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value;

    setValues({ email: nextEmail });
    setErrors((currentErrors) => ({
      ...currentErrors,
      email: touched.email ? validateEmail(nextEmail) : currentErrors.email,
    }));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value;

    setTouched({ email: true });
    setErrors({
      email: validateEmail(nextEmail),
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = {
      email: validateEmail(values.email),
    };

    setTouched({ email: true });
    setErrors(nextErrors);

    if (nextErrors.email) {
      return;
    }

    router.push('/reset-password');
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#f4efe7_100%)] px-3 py-3 md:flex md:min-h-screen md:items-center md:px-4 md:py-4 md:overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(18,35,47,0.1)] md:max-h-[calc(100vh-2rem)] lg:grid lg:grid-cols-[0.93fr,0.83fr]">
        <section className="relative overflow-hidden bg-[#dde8e2] px-5 py-4 md:px-5 md:py-5 lg:min-h-[460px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 top-0 h-36 w-48 rounded-full bg-white/26 blur-sm" />
            <div className="absolute right-[10%] top-[12%] h-40 w-40 rounded-full bg-[#f1e6d7] opacity-95" />
            <div className="absolute left-[10%] top-[22%] h-56 w-44 rounded-[40%_60%_53%_47%/44%_34%_66%_56%] border border-white/35 bg-white/14" />
            <div className="absolute left-[20%] top-[34%] h-10 w-60 rounded-full bg-[linear-gradient(90deg,rgba(17,49,44,0.88),rgba(14,122,111,0.64),rgba(255,255,255,0.08))] opacity-90 blur-[1px]" />
            <div className="absolute left-[-8%] bottom-[-12%] h-56 w-60 rounded-[50%_50%_55%_45%/42%_30%_70%_58%] bg-[#f3e2ce]" />
            <div className="absolute right-[-10%] bottom-[-10%] h-44 w-52 rounded-[58%_42%_61%_39%/44%_55%_45%_56%] bg-white/26" />
          </div>

          <div className="relative flex h-full flex-col">
            <Link href="/" className="text-lg font-extrabold tracking-[-0.04em] text-brand md:text-xl">
              SpendWise
            </Link>

            <div className="mt-6 max-w-[316px] rounded-[24px] border border-white/40 bg-white/38 p-4 shadow-[0_12px_24px_rgba(18,35,47,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Recovery Note
                </span>
              </div>
              <p className="mt-3 max-w-[22ch] text-[13px] font-semibold leading-5 text-slate-700">
                A recovery step should feel calm, private, and immediately understandable.
              </p>
            </div>

            <div className="relative mt-auto pt-8">
              <div className="max-w-[320px]">
                <h1
                  className="text-[1.95rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#13281f] md:text-[2.2rem]"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  Recover access, <span className="text-brand">with clarity.</span>
                </h1>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">
                  Recovery should guide users forward without exposing account details or creating unnecessary stress.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-4 md:px-5 md:py-5">
          <div className="mx-auto flex max-w-[360px] flex-col">
            <div className="space-y-2">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.55rem]">
                Forgot Password
              </h2>
              <p className="text-[13px] leading-5 text-slate-500">
                Enter the email linked to your account and we&apos;ll send reset instructions if it
                matches a registered profile.
              </p>
            </div>

            <form className="mt-5 space-y-3" noValidate onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500" htmlFor="recovery-email">
                  Account Email
                </label>
                <Input
                  aria-describedby="recovery-email-error"
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  className={cn(
                    'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                    errors.email && 'border-[var(--danger)]',
                  )}
                  id="recovery-email"
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
                  id="recovery-email-error"
                  role="alert"
                >
                  {errors.email ?? ' '}
                </p>
              </div>

              <div className="rounded-[18px] border border-[#ece7df] bg-[#fbf8f2] px-4 py-3 text-[12px] leading-5 text-slate-500">
                If the email matches an account, we&apos;ll send reset instructions. This keeps the
                recovery flow private and avoids exposing which emails are registered.
              </div>

              <Button
                className="mt-1 h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                size="lg"
                type="submit"
                variant="secondary"
              >
                Email Reset Instructions
              </Button>

              <p className="text-center text-[12px] text-slate-500">
                Remembered it?{' '}
                <Link className="font-semibold text-brand" href="/login">
                  Return to login
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
