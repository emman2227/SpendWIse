import { z } from 'zod';

export const AUTH_PASSWORD_MIN_LENGTH = 12;
export const AUTH_PASSWORD_MAX_LENGTH = 72;
export const AUTH_LOGIN_PASSWORD_MIN_LENGTH = 8;
export const AUTH_EMAIL_VERIFICATION_CODE_LENGTH = 6;
export const AUTH_PHONE_MIN_LENGTH = 10;
export const AUTH_PHONE_MAX_LENGTH = 15;

export const authNamePattern = /^[A-Za-z]+(?:['-][A-Za-z]+)*(?: [A-Za-z]+(?:['-][A-Za-z]+)*)*$/;
export const authNameSegmentPattern = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;
export const authEmailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const authPhonePattern = /^\+?[0-9]{10,15}$/;
export const authPasswordAllowedPattern = /^[!-~]+$/;
export const authPasswordUppercasePattern = /[A-Z]/;
export const authPasswordLowercasePattern = /[a-z]/;
export const authPasswordNumberPattern = /[0-9]/;
export const authPasswordSpecialCharacterPattern = /[^A-Za-z0-9]/;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .max(320, 'Email is too long.')
  .regex(authEmailPattern, 'Use a valid email address without spaces or emoji.');

const passwordCharacterSchema = z
  .string()
  .min(1)
  .regex(authPasswordAllowedPattern, 'Password cannot include spaces or emoji.');

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required.')
  .regex(
    authPhonePattern,
    `Use a valid phone number with ${AUTH_PHONE_MIN_LENGTH}-${AUTH_PHONE_MAX_LENGTH} digits.`,
  );

const strongPasswordSchema = passwordCharacterSchema
  .min(
    AUTH_PASSWORD_MIN_LENGTH,
    `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  )
  .max(AUTH_PASSWORD_MAX_LENGTH, `Password must be at most ${AUTH_PASSWORD_MAX_LENGTH} characters.`)
  .regex(authPasswordUppercasePattern, 'Password must include at least one uppercase letter.')
  .regex(authPasswordLowercasePattern, 'Password must include at least one lowercase letter.')
  .regex(authPasswordNumberPattern, 'Password must include at least one number.')
  .regex(
    authPasswordSpecialCharacterPattern,
    'Password must include at least one special character.',
  );

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.')
    .regex(authNamePattern, 'Name can only use letters, spaces, apostrophes, and hyphens.'),
  email: emailSchema,
  phone: phoneSchema,
  password: strongPasswordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordCharacterSchema
    .min(
      AUTH_LOGIN_PASSWORD_MIN_LENGTH,
      `Password must be at least ${AUTH_LOGIN_PASSWORD_MIN_LENGTH} characters.`,
    )
    .max(
      AUTH_PASSWORD_MAX_LENGTH,
      `Password must be at most ${AUTH_PASSWORD_MAX_LENGTH} characters.`,
    ),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}}$`),
      `Enter the ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`,
    ),
});

export const resendVerificationCodeSchema = z.object({
  email: emailSchema,
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const verifyPasswordResetCodeSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}}$`),
      `Enter the ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`,
    ),
});

export const resetPasswordWithCodeSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}}$`),
      `Enter the ${AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`,
    ),
  password: strongPasswordSchema,
});
