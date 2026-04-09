'use client';

import {
  AUTH_EMAIL_VERIFICATION_CODE_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  authEmailPattern,
  authNameSegmentPattern,
  authPasswordLowercasePattern,
  authPasswordNumberPattern,
  authPasswordSpecialCharacterPattern,
  authPasswordUppercasePattern,
  authPhonePattern,
} from '@spendwise/shared';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, EyeOff, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FocusEvent, type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import {
  authQueryKey,
  getAuthErrorMessage,
  registerWithCredentials,
  resendVerificationCode,
  verifyEmailCode,
} from '@/lib/auth/client';
import {
  sanitizeEmailInput,
  sanitizeNameInput,
  sanitizePasswordInput,
  sanitizePhoneInput,
} from '@/lib/auth/input';
import { getPasswordStrength } from '@/lib/auth/password-strength';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;
type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'code';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;
type Touched = Record<Field, boolean>;

const initialValues: Values = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  code: '',
};

const initialTouched: Touched = {
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
  password: false,
  code: false,
};

const stepFields: Record<Step, Field[]> = {
  1: ['firstName', 'lastName', 'email', 'phone'],
  2: ['password'],
  3: ['code'],
};

const sanitizeCodeInput = (value: string) =>
  value.replace(/\D/g, '').slice(0, AUTH_EMAIL_VERIFICATION_CODE_LENGTH);

const validatePassword = (password: string) => {
  if (!password) return 'Please create a password.';
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
    case 'firstName':
      if (!values.firstName) return 'Please enter your first name.';
      if (values.firstName.length < 2) return 'First name must be at least 2 characters.';
      return authNameSegmentPattern.test(values.firstName)
        ? ''
        : 'Only letters, apostrophes, and hyphens are allowed.';
    case 'lastName':
      if (!values.lastName) return 'Please enter your last name.';
      if (values.lastName.length < 2) return 'Last name must be at least 2 characters.';
      return authNameSegmentPattern.test(values.lastName)
        ? ''
        : 'Only letters, apostrophes, and hyphens are allowed.';
    case 'email':
      if (!values.email) return 'Please enter your email address.';
      return authEmailPattern.test(values.email)
        ? ''
        : 'Use a valid email address without spaces or emoji.';
    case 'phone':
      if (!values.phone) return 'Please enter your phone number.';
      return authPhonePattern.test(values.phone)
        ? ''
        : 'Use 10 to 15 digits, with an optional + at the start.';
    case 'password':
      return validatePassword(values.password);
    case 'code':
      if (!values.code) return 'Enter the verification code we sent.';
      return values.code.length === AUTH_EMAIL_VERIFICATION_CODE_LENGTH
        ? ''
        : `Enter the ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`;
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

export default function RegisterPage() {
  const queryClient = useQueryClient();
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
      field === 'firstName' || field === 'lastName'
        ? sanitizeNameInput(event.target.value)
        : field === 'email'
          ? sanitizeEmailInput(event.target.value)
          : field === 'phone'
            ? sanitizePhoneInput(event.target.value)
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

  const submitRegistration = async () => {
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
      const result = await registerWithCredentials({
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });

      setDeliveryHint(result.verificationDeliveryMethod);
      setNotice(
        result.verificationDeliveryMethod === 'log'
          ? 'Email delivery is unavailable right now, so the verification code was printed in the API terminal.'
          : `We sent a verification code to ${result.user.email}.`,
      );
      setStep(3);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to create your account right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === 1) {
      const nextErrors = getStepErrors(1, values);

      markTouched(1);
      setErrors((currentErrors) => ({ ...currentErrors, ...nextErrors }));
      setFormError('');

      if (!hasErrors(nextErrors)) {
        setStep(2);
      }

      return;
    }

    if (step === 2) {
      await submitRegistration();
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
      const user = await verifyEmailCode({ email: values.email, code: values.code });

      queryClient.setQueryData(authQueryKey, user);
      router.replace('/onboarding/welcome');
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to verify your email right now.'));
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
      const result = await resendVerificationCode({ email: values.email });

      setDeliveryHint(result.verificationDeliveryMethod);
      setNotice(
        result.verificationDeliveryMethod === 'log'
          ? 'Email delivery is unavailable right now, so the fresh code was printed in the API terminal.'
          : 'A fresh verification code is on the way to your inbox.',
      );
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to resend the verification code right now.'));
    } finally {
      setIsResending(false);
    }
  };

  const helperText =
    step === 2
      ? errors.password ||
        `Spaces and emoji are blocked. Use ${AUTH_PASSWORD_MIN_LENGTH}+ characters with upper/lowercase, number, and symbol.`
      : step === 3
        ? errors.code ||
          (deliveryHint === 'log'
            ? 'Email delivery is unavailable right now, so the code is being written to the API terminal.'
            : 'Check your inbox and spam folder for the latest verification code.')
        : '';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f4efe7_0%,#f7f2ea_46%,#efe6da_100%)] px-3 py-3 md:flex md:min-h-screen md:items-center md:px-4 md:py-4 md:overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(18,35,47,0.1)] md:max-h-[calc(100vh-2rem)] lg:grid lg:h-[500px] lg:grid-cols-[0.93fr,0.83fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#d8e4dc_0%,#dbe8df_100%)] px-5 py-4 md:px-5 md:py-5 lg:min-h-[500px]">
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
                  ? 'Start with the essentials.'
                  : step === 2
                    ? 'Create a password with confidence.'
                    : 'Verify the code and finish signing in.'}
              </h1>
              <p className="text-[13px] leading-6 text-slate-600">
                {step === 1
                  ? 'Signup feels smoother when the first step is simple and focused.'
                  : step === 2
                    ? 'Strong credentials should be guided, visible, and calm to complete.'
                    : 'The last step should confirm progress and point clearly to what happens next.'}
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
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <RefreshCw className="h-5 w-5" />
                    )}
                  </div>
                  <div className="h-3 w-14 rounded-full bg-brand/24" />
                </div>
                <div className="mt-5 rounded-[20px] border border-white/35 bg-white/18 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {step === 1 ? 'Profile setup' : step === 2 ? 'Password check' : 'Verification'}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {step === 1
                      ? `${values.firstName || 'First'} ${values.lastName || 'Last'}`
                      : step === 2
                        ? passwordStrength.label
                        : values.code.padEnd(AUTH_EMAIL_VERIFICATION_CODE_LENGTH, '*')}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {step === 3
                      ? values.email || 'registered@email.com'
                      : values.email || 'john@spendwise.com'}
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
                {step === 1 ? 'Profile' : step === 2 ? 'Password' : 'Verification'}
              </div>
              <h2 className="text-[1.48rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.6rem]">
                Create Account
              </h2>
              <p className="text-[13px] leading-5 text-slate-500">
                {step === 1
                  ? 'Enter your name, email, and phone number first.'
                  : step === 2
                    ? 'Create a strong password before we send your code.'
                    : 'Enter the verification code sent to your registered email.'}
              </p>
            </div>

            <form className="mt-4 flex h-full flex-col" noValidate onSubmit={handleSubmit}>
              <div className="space-y-3">
                {step === 1 ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                          htmlFor="firstName"
                        >
                          First Name
                        </label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={values.firstName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={isSubmitting}
                          placeholder="John"
                          autoComplete="given-name"
                          className={cn(
                            'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none focus:border-brand focus:bg-white',
                            errors.firstName && 'border-[var(--danger)]',
                          )}
                        />
                        <p
                          className={cn(
                            'text-[10px] leading-4',
                            errors.firstName ? 'min-h-[0.75rem] text-[var(--danger)]' : 'hidden',
                          )}
                        >
                          {errors.firstName ?? ' '}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label
                          className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                          htmlFor="lastName"
                        >
                          Last Name
                        </label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={values.lastName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={isSubmitting}
                          placeholder="Doe"
                          autoComplete="family-name"
                          className={cn(
                            'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none focus:border-brand focus:bg-white',
                            errors.lastName && 'border-[var(--danger)]',
                          )}
                        />
                        <p
                          className={cn(
                            'text-[10px] leading-4',
                            errors.lastName ? 'min-h-[0.75rem] text-[var(--danger)]' : 'hidden',
                          )}
                        >
                          {errors.lastName ?? ' '}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                        htmlFor="email"
                      >
                        Email Address
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

                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                        htmlFor="phone"
                      >
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        placeholder="+639123456789"
                        autoComplete="tel"
                        className={cn(
                          'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none focus:border-brand focus:bg-white',
                          errors.phone && 'border-[var(--danger)]',
                        )}
                      />
                      <p
                        className={cn(
                          'min-h-[0.75rem] text-[10px] leading-4',
                          errors.phone ? 'text-[var(--danger)]' : 'text-transparent',
                        )}
                      >
                        {errors.phone ?? ' '}
                      </p>
                    </div>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <div className="rounded-[20px] border border-[#ece7df] bg-[#fbf8f2] px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Registering
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {values.firstName} {values.lastName}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">{values.email}</p>
                      <p className="mt-1 text-[12px] text-slate-500">{values.phone}</p>
                    </div>

                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
                        htmlFor="password"
                      >
                        Create Password
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

                {step === 3 ? (
                  <>
                    <div className="rounded-[20px] border border-[#ece7df] bg-[#fbf8f2] px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Verification Destination
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{values.email}</p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {deliveryHint === 'log'
                          ? 'Email delivery is unavailable right now, so the code is in the API terminal.'
                          : 'A 6-digit code is waiting in this inbox.'}
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

              <div className="mt-auto space-y-2.5 pb-3 pt-4 md:pb-4">
                {step === 1 ? (
                  <Button
                    className="h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                    size="lg"
                    type="submit"
                    variant="secondary"
                    disabled={isSubmitting}
                  >
                    Continue to password
                  </Button>
                ) : null}

                {step === 2 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      className="h-10 rounded-full text-sm"
                      size="lg"
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      className="h-11 rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                      size="lg"
                      type="submit"
                      variant="secondary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send code'}
                    </Button>
                  </div>
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
                      {isSubmitting ? 'Verifying...' : 'Verify and continue'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Button
                        className="h-10 rounded-full text-sm"
                        size="lg"
                        type="button"
                        variant="outline"
                        disabled={isSubmitting || isResending}
                        onClick={() => setStep(2)}
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

                <p className="text-center text-[12px] text-slate-500">
                  Already have an account?{' '}
                  <Link className="font-semibold text-brand" href="/login">
                    Login
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
