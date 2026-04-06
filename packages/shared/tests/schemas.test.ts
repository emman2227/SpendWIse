import { describe, expect, it } from 'vitest';

import {
  AUTH_EMAIL_VERIFICATION_CODE_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  createExpenseSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordWithCodeSchema,
  verifyEmailSchema,
  verifyPasswordResetCodeSchema,
} from '../src';

describe('shared schemas', () => {
  it('accepts a valid expense payload', () => {
    const payload = createExpenseSchema.parse({
      amount: 275.5,
      categoryId: 'category-1',
      description: 'Weekly groceries',
      paymentMethod: 'debit_card',
      date: '2026-04-02T10:30:00.000Z',
    });

    expect(payload.description).toBe('Weekly groceries');
  });

  it('rejects an invalid email on login', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });

  it('rejects weak register passwords', () => {
    const result = registerSchema.safeParse({
      name: 'Maya Tan',
      email: 'maya@spendwise.app',
      password: 'Password1',
    });

    expect(result.success).toBe(false);
  });

  it('rejects emoji in auth fields', () => {
    const result = registerSchema.safeParse({
      name: 'Maya Tan',
      email: 'maya🙂@spendwise.app',
      password: `SecurePass1!${'a'.repeat(AUTH_PASSWORD_MIN_LENGTH - 12)}`,
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid email verification code', () => {
    const result = verifyEmailSchema.safeParse({
      email: 'maya@spendwise.app',
      code: '1'.repeat(AUTH_EMAIL_VERIFICATION_CODE_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it('accepts password reset payloads', () => {
    expect(
      requestPasswordResetSchema.safeParse({
        email: 'maya@spendwise.app',
      }).success,
    ).toBe(true);

    expect(
      verifyPasswordResetCodeSchema.safeParse({
        email: 'maya@spendwise.app',
        code: '1'.repeat(AUTH_EMAIL_VERIFICATION_CODE_LENGTH),
      }).success,
    ).toBe(true);

    expect(
      resetPasswordWithCodeSchema.safeParse({
        email: 'maya@spendwise.app',
        code: '1'.repeat(AUTH_EMAIL_VERIFICATION_CODE_LENGTH),
        password: `SecurePass1!${'a'.repeat(AUTH_PASSWORD_MIN_LENGTH - 12)}`,
      }).success,
    ).toBe(true);
  });
});
