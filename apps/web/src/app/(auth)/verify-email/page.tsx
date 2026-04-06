'use client';

import { AUTH_EMAIL_VERIFICATION_CODE_LENGTH, authEmailPattern } from '@spendwise/shared';
import { useQueryClient } from '@tanstack/react-query';
import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ChangeEvent, type FormEvent, Suspense, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  authQueryKey,
  getAuthErrorMessage,
  resendVerificationCode,
  verifyEmailCode,
} from '@/lib/auth/client';
import { sanitizeEmailInput } from '@/lib/auth/input';
import { cn } from '@/lib/utils';

const sanitizeCodeInput = (value: string) =>
  value.replace(/\D/g, '').slice(0, AUTH_EMAIL_VERIFICATION_CODE_LENGTH);

const validateEmail = (email: string) => {
  if (!email) {
    return 'Please enter your email address.';
  }

  return authEmailPattern.test(email) ? '' : 'Use a valid email address without spaces or emoji.';
};

const validateCode = (code: string) => {
  if (!code) {
    return 'Enter the verification code we sent.';
  }

  return code.length === AUTH_EMAIL_VERIFICATION_CODE_LENGTH
    ? ''
    : `Enter the ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`;
};

function VerifyEmailPageContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [deliveryHint, setDeliveryHint] = useState<'smtp' | 'log'>('smtp');

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    const deliveryFromQuery = searchParams.get('delivery');

    if (emailFromQuery) {
      setEmail(sanitizeEmailInput(emailFromQuery));
    }

    if (deliveryFromQuery === 'log') {
      setDeliveryHint('log');
    }
  }, [searchParams]);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeEmailInput(event.target.value);

    setEmail(nextValue);
    setFormError('');
    setNotice('');
    setEmailError(emailError ? validateEmail(nextValue) : '');
  };

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeCodeInput(event.target.value);

    setCode(nextValue);
    setFormError('');
    setNotice('');
    setCodeError(codeError ? validateCode(nextValue) : '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextEmailError = validateEmail(email);
    const nextCodeError = validateCode(code);

    setEmailError(nextEmailError);
    setCodeError(nextCodeError);
    setFormError('');
    setNotice('');

    if (nextEmailError || nextCodeError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await verifyEmailCode({ email, code });

      queryClient.setQueryData(authQueryKey, user);
      router.replace('/onboarding/welcome');
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to verify your email right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const nextEmailError = validateEmail(email);

    setEmailError(nextEmailError);
    setFormError('');
    setNotice('');

    if (nextEmailError) {
      return;
    }

    setIsResending(true);

    try {
      const result = await resendVerificationCode({ email });

      setDeliveryHint(result.verificationDeliveryMethod);
      setNotice(
        result.verificationDeliveryMethod === 'log'
          ? 'SMTP is not configured yet, so the fresh code was printed in the API terminal.'
          : 'A fresh verification code is on the way to your inbox.',
      );
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to resend the verification code right now.'));
    } finally {
      setIsResending(false);
    }
  };

  const helperText =
    deliveryHint === 'log'
      ? 'SMTP is not configured yet, so the verification code is being written to the API server terminal.'
      : 'Check your inbox and spam folder for the latest verification code.';

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#f4efe7_100%)] px-3 py-3 md:flex md:min-h-screen md:items-center md:px-4 md:py-4 md:overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(18,35,47,0.1)] md:max-h-[calc(100vh-2rem)] lg:grid lg:grid-cols-[0.93fr,0.83fr]">
        <section className="relative overflow-hidden bg-[#dbe6e0] px-5 py-4 md:px-5 md:py-5 lg:min-h-[460px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 top-0 h-40 w-56 rounded-full bg-white/28 blur-sm" />
            <div className="absolute right-[8%] top-[11%] h-44 w-44 rounded-full bg-[#f2eadb] opacity-95" />
            <div className="absolute left-[10%] top-[18%] h-52 w-52 rounded-[38%_62%_58%_42%/49%_41%_59%_51%] border border-white/30 bg-white/12" />
            <div className="absolute left-[18%] top-[32%] h-10 w-60 rounded-full bg-[linear-gradient(90deg,rgba(17,43,38,0.9),rgba(15,123,113,0.62),rgba(255,255,255,0.08))] opacity-90 blur-[1px]" />
            <div className="absolute -left-16 bottom-7 h-44 w-54 rounded-[46%_54%_57%_43%/44%_34%_66%_56%] bg-[#f3e3cf]" />
            <div className="absolute right-[-10%] bottom-[-10%] h-48 w-52 rounded-[58%_42%_61%_39%/44%_55%_45%_56%] bg-white/28" />
          </div>

          <div className="relative flex h-full flex-col">
            <Link
              href="/"
              className="text-lg font-extrabold tracking-[-0.04em] text-brand md:text-xl"
            >
              SpendWise
            </Link>

            <div className="mt-6 max-w-[316px] rounded-[24px] border border-white/40 bg-white/38 p-4 shadow-[0_12px_24px_rgba(18,35,47,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Verification Note
                </span>
              </div>
              <p className="mt-3 max-w-[24ch] text-[13px] font-semibold leading-5 text-slate-700">
                One short code keeps the signup flow secure without slowing down the next step.
              </p>
            </div>

            <div className="relative mt-auto pt-8">
              <div className="mb-5 grid max-w-[304px] grid-cols-[1.08fr,0.92fr] gap-3">
                <div className="rounded-[26px] border border-white/35 bg-white/20 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[linear-gradient(145deg,rgba(15,53,47,0.88),rgba(15,123,113,0.68))] text-white">
                      <MailCheck className="h-5 w-5" />
                    </div>
                    <div className="h-3 w-16 rounded-full bg-brand/24" />
                  </div>
                  <div className="mt-5 flex h-14 items-center justify-center rounded-[20px] border border-white/35 bg-white/18 px-4 text-[1.1rem] font-bold tracking-[0.35em] text-[#13281f]">
                    {code.padEnd(AUTH_EMAIL_VERIFICATION_CODE_LENGTH, '*')}
                  </div>
                  <div className="mt-4 h-2 w-20 rounded-full bg-slate-700/14" />
                </div>
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-white/35 bg-[#f5ede0] p-3">
                    <div className="flex h-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(15,123,113,0.2),rgba(255,255,255,0.68))] text-brand">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-white/35 bg-white/24 p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-brand">
                      <RefreshCw className="h-4 w-4" />
                      <div className="h-2.5 w-14 rounded-full bg-brand/24" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-[320px]">
                <h1
                  className="text-[1.95rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#13281f] md:text-[2.2rem]"
                  style={{ fontFamily: 'var(--font-fraunces)' }}
                >
                  Confirm your inbox, <span className="text-brand">unlock your workspace.</span>
                </h1>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">{helperText}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-4 md:px-5 md:py-5">
          <div className="mx-auto flex h-full max-w-[360px] flex-col">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                Verification
              </div>
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.55rem]">
                Enter Your Code
              </h2>
              <p className="text-[13px] leading-5 text-slate-500">
                Enter the {AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit code sent to your email to
                finish creating your SpendWise account.
              </p>
            </div>

            <form className="mt-5 flex h-full flex-col" noValidate onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label
                    className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <Input
                    aria-describedby="verify-email-error"
                    aria-invalid={Boolean(emailError)}
                    autoComplete="email"
                    className={cn(
                      'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                      emailError && 'border-[var(--danger)]',
                    )}
                    disabled={isSubmitting || isResending}
                    id="email"
                    name="email"
                    onChange={handleEmailChange}
                    placeholder="john@spendwise.com"
                    type="email"
                    value={email}
                  />
                  <p
                    className={cn(
                      'min-h-[0.75rem] text-[10px] leading-4',
                      emailError ? 'text-[var(--danger)]' : 'text-transparent',
                    )}
                    id="verify-email-error"
                    role="alert"
                  >
                    {emailError ?? ' '}
                  </p>
                </div>

                <div className="space-y-1">
                  <label
                    className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                    htmlFor="code"
                  >
                    Verification Code
                  </label>
                  <Input
                    aria-describedby="verification-code-error"
                    aria-invalid={Boolean(codeError)}
                    autoComplete="one-time-code"
                    className={cn(
                      'h-12 rounded-[16px] border border-transparent bg-[#f5f1eb] text-center font-mono text-lg tracking-[0.4em] shadow-none placeholder:tracking-[0.28em] placeholder:text-slate-400 focus:border-brand focus:bg-white',
                      codeError && 'border-[var(--danger)]',
                    )}
                    disabled={isSubmitting}
                    id="code"
                    inputMode="numeric"
                    maxLength={AUTH_EMAIL_VERIFICATION_CODE_LENGTH}
                    name="code"
                    onChange={handleCodeChange}
                    placeholder={'0'.repeat(AUTH_EMAIL_VERIFICATION_CODE_LENGTH)}
                    value={code}
                  />
                  <p
                    className={cn(
                      'min-h-[0.75rem] text-[10px] leading-4',
                      codeError ? 'text-[var(--danger)]' : 'text-slate-400',
                    )}
                    id="verification-code-error"
                    role="alert"
                  >
                    {codeError || helperText}
                  </p>
                </div>

                {deliveryHint === 'log' ? (
                  <div className="rounded-[18px] border border-brand/15 bg-brand/10 px-4 py-3 text-[12px] leading-5 text-slate-700">
                    The app is in local log mode right now. Open the API terminal to see the latest
                    verification code until SMTP is configured.
                  </div>
                ) : null}

                {formError ? (
                  <div className="rounded-[16px] border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-[12px] text-[var(--danger)]">
                    {formError}
                  </div>
                ) : null}

                {notice ? (
                  <div className="rounded-[16px] border border-brand/15 bg-brand/10 px-4 py-3 text-[12px] text-slate-700">
                    {notice}
                  </div>
                ) : null}
              </div>

              <div className="mt-auto space-y-2.5 pt-4">
                <Button
                  className="h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                  disabled={isSubmitting}
                  size="lg"
                  type="submit"
                  variant="secondary"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </Button>
                <Button
                  className="h-10 w-full rounded-full text-sm"
                  disabled={isResending || isSubmitting}
                  size="lg"
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Button>
                <p className="text-center text-[12px] text-slate-500">
                  Already verified?{' '}
                  <Link className="font-semibold text-brand" href="/login">
                    Back to login
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
