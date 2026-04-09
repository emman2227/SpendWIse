'use client';

import {
  AUTH_EMAIL_VERIFICATION_CODE_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  authEmailPattern,
  authPasswordLowercasePattern,
  authPasswordNumberPattern,
  authPasswordSpecialCharacterPattern,
  authPasswordUppercasePattern,
} from '@spendwise/shared';
import { CheckCircle2, Eye, EyeOff, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FocusEvent, type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import {
  getAuthErrorMessage,
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from '@/lib/auth/client';
import { sanitizeEmailInput, sanitizePasswordInput } from '@/lib/auth/input';
import { getPasswordStrength } from '@/lib/auth/password-strength';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;
type Field = 'email' | 'code' | 'password';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;
type Touched = Record<Field, boolean>;

const initialValues: Values = {
  email: '',
  code: '',
  password: '',
};

const initialTouched: Touched = {
  email: false,
  code: false,
  password: false,
};

const stepFields: Record<Step, Field[]> = {
  1: ['email'],
  2: ['code'],
  3: ['password'],
};

const sanitizeCodeInput = (value: string) =>
  value.replace(/\D/g, '').slice(0, AUTH_EMAIL_VERIFICATION_CODE_LENGTH);

const validatePassword = (password: string) => {
  if (!password) return 'Please create a new password.';
  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!authPasswordUppercasePattern.test(password))
    return 'Password must include an uppercase letter.';
  if (!authPasswordLowercasePattern.test(password))
    return 'Password must include a lowercase letter.';
  if (!authPasswordNumberPattern.test(password)) return 'Password must include a number.';
  if (!authPasswordSpecialCharacterPattern.test(password)) {
    return 'Password must include a special character.';
  }

  return '';
};

const validateField = (field: Field, values: Values) => {
  switch (field) {
    case 'email':
      if (!values.email) return 'Please enter your email address.';
      return authEmailPattern.test(values.email)
        ? ''
        : 'Use a valid email address without spaces or emoji.';
    case 'code':
      if (!values.code) return 'Enter the password reset code we sent.';
      return values.code.length === AUTH_EMAIL_VERIFICATION_CODE_LENGTH
        ? ''
        : `Enter the ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`;
    case 'password':
      return validatePassword(values.password);
    default:
      return '';
  }
};

const getStepErrors = (step: Step, values: Values) =>
  stepFields[step].reduce<Errors>((accumulator, field) => {
    accumulator[field] = validateField(field, values);
    return accumulator;
  }, {});

const hasErrors = (errors: Errors) => Object.values(errors).some(Boolean);

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>(initialTouched);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deliveryHint, setDeliveryHint] = useState<'smtp' | 'log'>('smtp');
  const passwordStrength = getPasswordStrength(values.password);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as Field;
    const nextValue =
      field === 'email'
        ? sanitizeEmailInput(event.target.value)
        : field === 'code'
          ? sanitizeCodeInput(event.target.value)
          : sanitizePasswordInput(event.target.value);
    const nextValues = { ...values, [field]: nextValue };

    setValues(nextValues);
    setFormError('');
    setNotice('');
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: touched[field] ? validateField(field, nextValues) : currentErrors[field],
    }));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const field = event.target.name as Field;

    setTouched((currentTouched) => ({ ...currentTouched, [field]: true }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: validateField(field, values),
    }));
  };

  const markTouched = (currentStep: Step) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      ...stepFields[currentStep].reduce<Partial<Touched>>((accumulator, field) => {
        accumulator[field] = true;
        return accumulator;
      }, {}),
    }));
  };

  const requestCode = async () => {
    const nextErrors = getStepErrors(1, values);

    markTouched(1);
    setErrors((currentErrors) => ({ ...currentErrors, ...nextErrors }));
    setFormError('');
    setNotice('');

    if (hasErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset({ email: values.email });

      setDeliveryHint(result.verificationDeliveryMethod);
      setNotice(
        result.verificationDeliveryMethod === 'log'
          ? 'Email delivery is unavailable right now, so the reset code was printed in the API terminal.'
          : `We sent a password reset code to ${result.email}.`,
      );
      setStep(2);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to start password recovery right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    const nextErrors = {
      ...getStepErrors(1, values),
      ...getStepErrors(2, values),
    };

    markTouched(2);
    setErrors(nextErrors);
    setFormError('');
    setNotice('');

    if (hasErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyPasswordResetCode({ email: values.email, code: values.code });
      setStep(3);
      setNotice('Code accepted. You can create your new password now.');
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to verify that reset code right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === 1) {
      await requestCode();
      return;
    }

    if (step === 2) {
      await verifyCode();
      return;
    }

    const nextErrors = {
      ...getStepErrors(1, values),
      ...getStepErrors(2, values),
      ...getStepErrors(3, values),
    };

    markTouched(3);
    setErrors(nextErrors);
    setFormError('');
    setNotice('');

    if (hasErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        email: values.email,
        code: values.code,
        password: values.password,
      });
      router.replace('/login?reason=password-reset');
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to reset your password right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const emailError = validateField('email', values);

    setErrors((currentErrors) => ({ ...currentErrors, email: emailError }));
    setTouched((currentTouched) => ({ ...currentTouched, email: true }));
    setFormError('');
    setNotice('');

    if (emailError) {
      return;
    }

    setIsResending(true);

    try {
      const result = await requestPasswordReset({ email: values.email });

      setDeliveryHint(result.verificationDeliveryMethod);
      setNotice(
        result.verificationDeliveryMethod === 'log'
          ? 'Email delivery is unavailable right now, so the fresh reset code was printed in the API terminal.'
          : 'A fresh reset code is on the way to your inbox.',
      );
    } catch (error) {
      setFormError(
        getAuthErrorMessage(error, 'Unable to resend the password reset code right now.'),
      );
    } finally {
      setIsResending(false);
    }
  };

  const helperText =
    step === 2
      ? errors.code ||
        (deliveryHint === 'log'
          ? 'Email delivery is unavailable right now, so the reset code is being written to the API terminal.'
          : 'Check your inbox and spam folder for the latest reset code.')
      : step === 3
        ? errors.password ||
          `Spaces and emoji are blocked. Use ${AUTH_PASSWORD_MIN_LENGTH}+ characters with upper/lowercase, number, and symbol.`
        : '';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f4efe7_0%,#f7f2ea_46%,#efe6da_100%)] px-3 py-3 md:flex md:min-h-screen md:items-center md:px-4 md:py-4 md:overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(18,35,47,0.1)] md:max-h-[calc(100vh-2rem)] lg:grid lg:h-[500px] lg:grid-cols-[0.93fr,0.83fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#d7e3dd_0%,#dce8e1_100%)] px-5 py-4 md:px-5 md:py-5 lg:min-h-[500px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-12 top-0 h-40 w-64 rounded-full bg-white/24 blur-md" />
            <div className="absolute right-[8%] top-[10%] h-52 w-52 rounded-full bg-[#f4ead9] opacity-90" />
            <div className="absolute left-[12%] top-[22%] h-56 w-56 rounded-[42%_58%_59%_41%/48%_43%_57%_52%] border border-white/35 bg-white/12" />
            <div className="absolute left-[18%] top-[34%] h-10 w-56 rounded-full bg-[linear-gradient(90deg,rgba(18,40,33,0.86),rgba(15,123,113,0.54),rgba(255,255,255,0.08))] opacity-90 blur-[1px]" />
            <div className="absolute -left-16 bottom-8 h-48 w-56 rounded-[48%_52%_57%_43%/44%_34%_66%_56%] bg-[#f5e6d2]" />
            <div className="absolute right-[-10%] bottom-[-10%] h-48 w-56 rounded-[58%_42%_61%_39%/44%_55%_45%_56%] bg-white/28" />
          </div>

          <div className="relative flex h-full flex-col">
            <Link
              href="/"
              className="text-lg font-extrabold tracking-[-0.04em] text-brand md:text-xl"
            >
              SpendWise
            </Link>

            <div className="mt-6 max-w-[20rem] space-y-3">
              <div className="inline-flex rounded-full bg-white/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                Step {step} of 3
              </div>
              <h1
                className="text-[2rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[#13281f] md:text-[2.4rem]"
                style={{ fontFamily: 'var(--font-fraunces)' }}
              >
                {step === 1
                  ? 'Recover access with a clear first step.'
                  : step === 2
                    ? 'Confirm the reset code.'
                    : 'Set a stronger password and continue.'}
              </h1>
              <p className="text-[13px] leading-6 text-slate-600">
                {step === 1
                  ? 'Password recovery should feel private, calm, and easy to start.'
                  : step === 2
                    ? 'Code entry works best when it feels direct and low-friction.'
                    : 'A new password should come with the same strength guidance used during signup.'}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((currentStep) => (
                <div
                  key={currentStep}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    step === currentStep
                      ? 'w-16 bg-brand'
                      : step > currentStep
                        ? 'w-10 bg-brand/45'
                        : 'w-10 bg-white/60',
                  )}
                />
              ))}
            </div>

            <div className="mt-8 grid max-w-[340px] gap-3">
              <div className="rounded-[28px] border border-white/35 bg-white/22 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[linear-gradient(145deg,rgba(17,43,38,0.88),rgba(15,123,113,0.68))] text-white">
                    {step === 1 ? (
                      <MailCheck className="h-5 w-5" />
                    ) : step === 2 ? (
                      <RefreshCw className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <div className="h-3 w-14 rounded-full bg-brand/24" />
                </div>
                <div className="mt-5 rounded-[20px] border border-white/35 bg-white/18 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {step === 1 ? 'Recovery setup' : step === 2 ? 'Code check' : 'Password update'}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {step === 1
                      ? values.email || 'john@spendwise.com'
                      : step === 2
                        ? values.code.padEnd(AUTH_EMAIL_VERIFICATION_CODE_LENGTH, '*')
                        : passwordStrength.label}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {values.email || 'registered@email.com'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto bg-white px-5 pb-6 pt-4 md:px-5 md:pb-7 md:pt-5">
          <div className="mx-auto flex h-full max-w-[360px] flex-col">
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {step === 1 ? 'Email' : step === 2 ? 'Code' : 'New password'}
              </div>
              <h2 className="text-[1.48rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.6rem]">
                Forgot Password
              </h2>
              <p className="text-[13px] leading-5 text-slate-500">
                {step === 1
                  ? 'Enter your registered email address.'
                  : step === 2
                    ? 'Enter the reset code sent to that email.'
                    : 'Create your new password with the strength guide below.'}
              </p>
            </div>

            <form className="mt-4 flex h-full flex-col" noValidate onSubmit={handleSubmit}>
              <div className="space-y-3">
                {step === 1 ? (
                  <div className="space-y-1">
                    <label
                      className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                      htmlFor="email"
                    >
                      Account Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      placeholder="john@spendwise.com"
                      autoComplete="email"
                      className={cn(
                        'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none focus:border-brand focus:bg-white',
                        errors.email && 'border-[var(--danger)]',
                      )}
                    />
                    <p
                      className={cn(
                        'min-h-[0.75rem] text-[10px] leading-4',
                        errors.email ? 'text-[var(--danger)]' : 'text-transparent',
                      )}
                    >
                      {errors.email ?? ' '}
                    </p>
                  </div>
                ) : null}

                {step === 2 ? (
                  <>
                    <div className="rounded-[20px] border border-[#ece7df] bg-[#fbf8f2] px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Reset Destination
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{values.email}</p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {deliveryHint === 'log'
                          ? 'Email delivery is unavailable right now, so the code is in the API terminal.'
                          : 'A 6-digit reset code is waiting in this inbox.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                        htmlFor="code"
                      >
                        Reset Code
                      </label>
                      <Input
                        id="code"
                        name="code"
                        value={values.code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        placeholder={'0'.repeat(AUTH_EMAIL_VERIFICATION_CODE_LENGTH)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={AUTH_EMAIL_VERIFICATION_CODE_LENGTH}
                        className={cn(
                          'h-12 rounded-[16px] border border-transparent bg-[#f5f1eb] text-center font-mono text-lg tracking-[0.4em] shadow-none focus:border-brand focus:bg-white',
                          errors.code && 'border-[var(--danger)]',
                        )}
                      />
                      <p
                        className={cn(
                          'min-h-[0.75rem] text-[10px] leading-4',
                          errors.code ? 'text-[var(--danger)]' : 'text-slate-400',
                        )}
                      >
                        {helperText}
                      </p>
                    </div>
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    <div className="rounded-[20px] border border-[#ece7df] bg-[#fbf8f2] px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Updating password for
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{values.email}</p>
                    </div>

                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                        htmlFor="password"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={isSubmitting}
                          placeholder="Create a secure password"
                          autoComplete="new-password"
                          className={cn(
                            'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] pr-11 text-sm shadow-none focus:border-brand focus:bg-white',
                            errors.password && 'border-[var(--danger)]',
                          )}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 hover:text-slate-700"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                      >
                        {helperText}
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-[#ebe6df] bg-[#faf7f2] px-3.5 py-3">
                      <ProgressBar
                        label="Password strength"
                        helper={passwordStrength.label}
                        size="sm"
                        status={passwordStrength.status}
                        value={passwordStrength.progress}
                      />
                      <div className="mt-2.5 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                        {passwordStrength.checklist.map((item) => (
                          <div
                            key={item.label}
                            className={cn(
                              'flex items-center gap-1.5 text-[10.5px] leading-4',
                              item.passed ? 'text-emerald-700' : 'text-slate-500',
                            )}
                          >
                            <CheckCircle2
                              className={cn(
                                'h-3.5 w-3.5 shrink-0',
                                item.passed ? 'text-emerald-600' : 'text-slate-300',
                              )}
                            />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
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
                {step === 1 ? (
                  <Button
                    className="h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                    size="lg"
                    type="submit"
                    variant="secondary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send reset code'}
                  </Button>
                ) : null}

                {step === 2 ? (
                  <>
                    <Button
                      className="h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                      size="lg"
                      type="submit"
                      variant="secondary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify code'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Button
                        className="h-10 rounded-full text-sm"
                        size="lg"
                        type="button"
                        variant="outline"
                        disabled={isSubmitting || isResending}
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        className="h-10 rounded-full text-sm"
                        size="lg"
                        type="button"
                        variant="outline"
                        disabled={isSubmitting || isResending}
                        onClick={handleResend}
                      >
                        {isResending ? 'Sending...' : 'Resend code'}
                      </Button>
                    </div>
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    <Button
                      className="h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                      size="lg"
                      type="submit"
                      variant="secondary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save new password'}
                    </Button>
                    <Button
                      className="h-10 w-full rounded-full text-sm"
                      size="lg"
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setStep(2)}
                    >
                      Back to code entry
                    </Button>
                  </>
                ) : null}

                <p className="text-center text-[12px] text-slate-500">
                  Remembered it?{' '}
                  <Link className="font-semibold text-brand" href="/login">
                    Return to login
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
