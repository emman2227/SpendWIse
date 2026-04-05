'use client';

import {
  AUTH_PASSWORD_MIN_LENGTH,
  authEmailPattern,
  authNameSegmentPattern,
  authPasswordLowercasePattern,
  authPasswordNumberPattern,
  authPasswordSpecialCharacterPattern,
  authPasswordUppercasePattern,
} from '@spendwise/shared';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FocusEvent, type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { authQueryKey, getAuthErrorMessage, registerWithCredentials } from '@/lib/auth/client';
import { sanitizeEmailInput, sanitizeNameInput, sanitizePasswordInput } from '@/lib/auth/input';
import { getPasswordStrength } from '@/lib/auth/password-strength';
import { cn } from '@/lib/utils';

type RegisterField = 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword';
type RegisterStep = 1 | 2;

type RegisterValues = Record<RegisterField, string>;
type RegisterErrors = Partial<Record<RegisterField, string>>;
type RegisterTouched = Record<RegisterField, boolean>;

const initialValues: RegisterValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const initialTouched: RegisterTouched = {
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  confirmPassword: false,
};

const stepFields: Record<RegisterStep, RegisterField[]> = {
  1: ['firstName', 'lastName', 'email'],
  2: ['password', 'confirmPassword'],
};

const validatePassword = (password: string) => {
  if (!password) return 'Please create a password.';
  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!authPasswordUppercasePattern.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!authPasswordLowercasePattern.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!authPasswordNumberPattern.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!authPasswordSpecialCharacterPattern.test(password)) {
    return 'Password must include at least one special character.';
  }

  return '';
};

const validateField = (field: RegisterField, values: RegisterValues) => {
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
    case 'password':
      return validatePassword(values.password);
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Please confirm your password.';
      return values.confirmPassword === values.password ? '' : 'Passwords do not match.';
    default:
      return '';
  }
};

const getStepErrors = (step: RegisterStep, values: RegisterValues) =>
  stepFields[step].reduce<RegisterErrors>((accumulator, field) => {
    accumulator[field] = validateField(field, values);
    return accumulator;
  }, {});

const hasErrors = (errors: RegisterErrors) => Object.values(errors).some(Boolean);

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
      d="M12 22.1823C14.751 22.1823 17.0574 21.2705 18.7419 19.435L15.451 16.8808C14.5392 17.4917 13.3728 17.8551 12 17.8551C9.34638 17.8551 7.09823 16.0627 6.29783 13.6543H2.89514V16.2912C4.57054 19.6211 8.01452 22.1823 12 22.1823Z"
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

export default function RegisterPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>(1);
  const [values, setValues] = useState<RegisterValues>(initialValues);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [touched, setTouched] = useState<RegisterTouched>(initialTouched);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordStrength = getPasswordStrength(values.password);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as RegisterField;
    const nextValue =
      field === 'firstName' || field === 'lastName'
        ? sanitizeNameInput(event.target.value)
        : field === 'email'
          ? sanitizeEmailInput(event.target.value)
          : sanitizePasswordInput(event.target.value);
    const nextValues = {
      ...values,
      [field]: nextValue,
    };

    setValues(nextValues);
    setFormError('');
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: touched[field] ? validateField(field, nextValues) : currentErrors[field],
      ...(field === 'password' && touched.confirmPassword
        ? { confirmPassword: validateField('confirmPassword', nextValues) }
        : {}),
    }));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const field = event.target.name as RegisterField;

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

  const markStepTouched = (currentStep: RegisterStep) => {
    setTouched((currentTouched) => ({
      ...currentTouched,
      ...stepFields[currentStep].reduce<Partial<RegisterTouched>>((accumulator, field) => {
        accumulator[field] = true;
        return accumulator;
      }, {}),
    }));
  };

  const handleContinue = () => {
    const nextErrors = getStepErrors(1, values);
    markStepTouched(1);
    setErrors((currentErrors) => ({ ...currentErrors, ...nextErrors }));

    if (hasErrors(nextErrors)) return;
    setStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === 1) {
      handleContinue();
      return;
    }

    const nextErrors = {
      ...getStepErrors(1, values),
      ...getStepErrors(2, values),
    };

    markStepTouched(2);
    setErrors(nextErrors);
    setFormError('');

    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);

    try {
      const user = await registerWithCredentials({
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        password: values.password,
      });

      queryClient.setQueryData(authQueryKey, user);
      router.replace('/dashboard');
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to create your account right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordHelperText = errors.password
    ? errors.password
    : `Spaces and emoji are blocked. Use ${AUTH_PASSWORD_MIN_LENGTH}+ characters with upper/lowercase, number, and symbol.`;

  const stepTitle = step === 1 ? "Let's start with your details." : 'Create your secure password.';
  const stepDescription =
    step === 1
      ? 'We only need a few basics to set up your account.'
      : 'One more step and your SpendWise account is ready.';

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#f4efe7_100%)] px-3 py-3 md:flex md:min-h-screen md:items-center md:px-4 md:py-4 md:overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[22px] bg-white shadow-[0_18px_48px_rgba(18,35,47,0.1)] md:max-h-[calc(100vh-2rem)] lg:grid lg:grid-cols-[0.93fr,0.83fr]">
        <section
          className={cn(
            'relative overflow-hidden px-5 py-4 md:px-5 md:py-5 lg:min-h-[460px]',
            step === 1 ? 'bg-[#dce8de]' : 'bg-[#d8e4df]',
          )}
        >
          <div className="pointer-events-none absolute inset-0">
            {step === 1 ? (
              <>
                <div className="absolute -left-10 top-0 h-40 w-56 rounded-full bg-white/28 blur-sm" />
                <div className="absolute right-6 top-12 h-52 w-52 rounded-full bg-[#f6efe1] opacity-95 blur-[2px]" />
                <div className="absolute -left-16 bottom-8 h-44 w-52 rounded-[42%_58%_57%_43%/51%_33%_67%_49%] bg-[#f6ecda] opacity-95" />
                <div className="absolute -right-12 bottom-[-4rem] h-44 w-52 rounded-[55%_45%_57%_43%/44%_37%_63%_56%] bg-white/36" />
                <div className="absolute left-8 top-5 h-52 w-52 rounded-[38%_62%_63%_37%/50%_45%_55%_50%] border border-white/30 bg-white/12" />
              </>
            ) : (
              <>
                <div className="absolute -left-8 top-[-1.5rem] h-36 w-52 rounded-full bg-white/24 blur-sm" />
                <div className="absolute right-[7%] top-[10%] h-44 w-44 rounded-full bg-[#efe8d9] opacity-95" />
                <div className="absolute left-[9%] top-[18%] h-48 w-44 rounded-[42%_58%_48%_52%/50%_35%_65%_50%] border border-white/30 bg-white/12" />
                <div className="absolute left-[20%] top-[30%] h-10 w-56 rounded-full bg-[linear-gradient(90deg,rgba(15,43,39,0.88),rgba(15,123,113,0.62),rgba(255,255,255,0.08))] opacity-90 blur-[1px]" />
                <div className="absolute -left-16 bottom-8 h-40 w-52 rounded-[48%_52%_57%_43%/45%_34%_66%_55%] bg-[#f4e7d5] opacity-95" />
                <div className="absolute right-[-9%] bottom-[-12%] h-48 w-52 rounded-[56%_44%_61%_39%/42%_52%_48%_58%] bg-white/30" />
              </>
            )}
          </div>

          <div className="relative flex h-full flex-col">
            <Link href="/" className="text-lg font-extrabold tracking-[-0.04em] text-brand md:text-xl">
              SpendWise
            </Link>

            <div className="mt-6 max-w-md space-y-3">
              <h1
                className="max-w-[11ch] text-[1.95rem] font-semibold leading-[1.01] text-[#13281f] md:text-[2.25rem]"
                style={{ fontFamily: 'var(--font-fraunces)' }}
              >
                Editorial Intelligence for Your <span className="text-brand">Wealth.</span>
              </h1>

              <p className="max-w-sm text-[13px] leading-6 text-slate-600">
                Join a community of modern planners using calm, sophisticated tools to master
                their financial story with more confidence.
              </p>
            </div>

            <div className="relative mt-auto hidden pt-8 md:block">
              {step === 1 ? (
                <div className="relative h-[138px] max-w-[330px]">
                  <div className="absolute left-0 top-5 h-24 w-40 rounded-[30px] border border-white/35 bg-white/18 backdrop-blur-sm" />
                  <div className="absolute left-5 top-0 h-20 w-20 rounded-[26px] bg-[linear-gradient(160deg,rgba(16,52,46,0.84),rgba(17,131,121,0.58))] shadow-[0_18px_36px_rgba(16,52,46,0.18)]" />
                  <div className="absolute left-[7.25rem] top-8 h-16 w-28 rounded-[24px] border border-white/40 bg-white/26 backdrop-blur-sm" />
                  <div className="absolute left-[10.5rem] top-3 h-10 w-36 rounded-full bg-[linear-gradient(90deg,rgba(18,40,33,0.82),rgba(15,123,113,0.56),rgba(255,255,255,0.08))] opacity-90 blur-[1px]" />
                  <div className="absolute bottom-0 left-6 h-3 w-24 rounded-full bg-slate-700/12" />
                  <div className="absolute bottom-5 left-[9.5rem] h-9 w-20 rounded-[20px] border border-white/35 bg-[#f4eddf]/70" />
                </div>
              ) : (
                <div className="relative h-[148px] max-w-[334px]">
                  <div className="absolute left-0 top-3 h-28 w-48 rounded-[34px] border border-white/35 bg-white/16 backdrop-blur-sm" />
                  <div className="absolute left-6 top-7 h-14 w-28 rounded-[24px] bg-[linear-gradient(135deg,rgba(14,51,46,0.9),rgba(18,124,113,0.54))] shadow-[0_18px_34px_rgba(16,52,46,0.16)]" />
                  <div className="absolute left-[10.5rem] top-0 h-20 w-20 rounded-[28px] border border-white/38 bg-[#f5ede0]/76" />
                  <div className="absolute left-[9.5rem] top-[4.25rem] h-18 w-32 rounded-[24px] border border-white/38 bg-white/24 backdrop-blur-sm" />
                  <div className="absolute right-1 top-6 h-12 w-24 rounded-full bg-[linear-gradient(90deg,rgba(18,40,33,0.82),rgba(15,123,113,0.5),rgba(255,255,255,0.1))] opacity-90 blur-[1px]" />
                  <div className="absolute bottom-4 left-5 h-2.5 w-20 rounded-full bg-slate-700/12" />
                  <div className="absolute bottom-0 left-[10.5rem] h-10 w-24 rounded-[22px] border border-white/35 bg-white/22 backdrop-blur-sm" />
                  <div className="absolute bottom-3 left-[11.75rem] h-3 w-12 rounded-full bg-brand/24" />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-4 md:px-5 md:py-5">
          <div className="mx-auto flex h-full max-w-[360px] flex-col">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                <span>Step {step} of 2</span>
                <div className="flex items-center gap-2">
                  <span className={cn('h-1.5 w-10 rounded-full', step >= 1 ? 'bg-brand' : 'bg-slate-200')} />
                  <span className={cn('h-1.5 w-10 rounded-full', step === 2 ? 'bg-brand' : 'bg-slate-200')} />
                </div>
              </div>
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.55rem]">
                Create Account
              </h2>
              <p className="text-[13px] leading-5 text-slate-500">{stepTitle}</p>
              <p className="text-[12px] leading-5 text-slate-400">{stepDescription}</p>
            </div>

            {step === 1 ? (
              <div className="mt-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
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
              </div>
            ) : null}

            <form
              className={cn('mt-3.5 flex flex-1 flex-col', step === 2 && 'mt-1.5')}
              noValidate
              onSubmit={handleSubmit}
            >
              <div className={cn('min-h-[292px] space-y-3', step === 2 && '-mt-1')}>
                {step === 1 ? (
                  <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500" htmlFor="firstName">
                        First Name
                      </label>
                      <Input
                        aria-describedby="firstName-error"
                        aria-invalid={Boolean(errors.firstName)}
                        autoComplete="given-name"
                        className={cn(
                          'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                          errors.firstName && 'border-[var(--danger)]',
                        )}
                        disabled={isSubmitting}
                        id="firstName"
                        name="firstName"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="John"
                        value={values.firstName}
                      />
                      <p className={cn('min-h-[0.75rem] text-[10px] leading-4', errors.firstName ? 'text-[var(--danger)]' : 'text-transparent')} id="firstName-error" role="alert">
                        {errors.firstName ?? ' '}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500" htmlFor="lastName">
                        Last Name
                      </label>
                      <Input
                        aria-describedby="lastName-error"
                        aria-invalid={Boolean(errors.lastName)}
                        autoComplete="family-name"
                        className={cn(
                          'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                          errors.lastName && 'border-[var(--danger)]',
                        )}
                        disabled={isSubmitting}
                        id="lastName"
                        name="lastName"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Doe"
                        value={values.lastName}
                      />
                      <p className={cn('min-h-[0.75rem] text-[10px] leading-4', errors.lastName ? 'text-[var(--danger)]' : 'text-transparent')} id="lastName-error" role="alert">
                        {errors.lastName ?? ' '}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500" htmlFor="email">
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
                    <p className={cn('min-h-[0.75rem] text-[10px] leading-4', errors.email ? 'text-[var(--danger)]' : 'text-transparent')} id="email-error" role="alert">
                      {errors.email ?? ' '}
                    </p>
                  </div>

                  {formError ? (
                    <div className="rounded-[16px] border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-[12px] text-[var(--danger)]">
                      {formError}
                    </div>
                  ) : null}

                  <Button
                    className="mt-0.5 h-11 w-full rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                    disabled={isSubmitting}
                    size="lg"
                    type="button"
                    variant="secondary"
                    onClick={handleContinue}
                  >
                    Continue
                  </Button>

                  <p className="text-center text-[12px] text-slate-500">
                    Already have an account?{' '}
                    <Link className="font-semibold text-brand" href="/login">
                      Login
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500" htmlFor="password">
                      Create Password
                    </label>
                    <div className="relative">
                      <Input
                        aria-describedby="password-error"
                        aria-invalid={Boolean(errors.password)}
                        autoComplete="new-password"
                        className={cn(
                          'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] pr-11 text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                          errors.password && 'border-[var(--danger)]',
                        )}
                        disabled={isSubmitting}
                        id="password"
                        name="password"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Create a secure password"
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
                    <p className={cn('min-h-[0.75rem] text-[10px] leading-4', errors.password ? 'text-[var(--danger)]' : 'text-slate-400')} id="password-error" role="alert">
                      {passwordHelperText}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-[#ebe6df] bg-[#faf7f2] px-3.5 py-3">
                    <ProgressBar
                      helper={passwordStrength.label}
                      label="Password strength"
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

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500" htmlFor="confirmPassword">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        aria-describedby="confirmPassword-error"
                        aria-invalid={Boolean(errors.confirmPassword)}
                        autoComplete="new-password"
                        className={cn(
                          'h-10 rounded-[14px] border border-transparent bg-[#f5f1eb] pr-11 text-sm shadow-none placeholder:text-slate-400 focus:border-brand focus:bg-white',
                          errors.confirmPassword && 'border-[var(--danger)]',
                        )}
                        disabled={isSubmitting}
                        id="confirmPassword"
                        name="confirmPassword"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Repeat your password"
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
                    <p className={cn('min-h-[0.75rem] text-[10px] leading-4', errors.confirmPassword ? 'text-[var(--danger)]' : 'text-transparent')} id="confirmPassword-error" role="alert">
                      {errors.confirmPassword ?? ' '}
                    </p>
                  </div>

                  {formError ? (
                    <div className="rounded-[16px] border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-[12px] text-[var(--danger)]">
                      {formError}
                    </div>
                  ) : null}

                  <div className="mt-1 grid grid-cols-2 gap-2.5">
                    <Button className="h-10 rounded-full text-sm" disabled={isSubmitting} size="lg" type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      className="h-11 rounded-full text-sm shadow-[0_12px_24px_rgba(15,123,113,0.2)]"
                      disabled={isSubmitting}
                      size="lg"
                      type="submit"
                      variant="secondary"
                    >
                      {isSubmitting ? 'Creating...' : 'Sign Up'}
                    </Button>
                  </div>
                  </>
                )}
              </div>

              {step === 2 ? (
                <p className="mt-auto pt-4 text-center text-[12px] text-slate-500">
                  Already have an account?{' '}
                  <Link className="font-semibold text-brand" href="/login">
                    Login
                  </Link>
                </p>
              ) : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
