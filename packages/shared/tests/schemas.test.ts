import { describe, expect, it } from 'vitest';

import {
  AUTH_EMAIL_VERIFICATION_CODE_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PHONE_MAX_LENGTH,
  createExpenseSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordWithCodeSchema,
  verifyEmailSchema,
  verifyPasswordResetCodeSchema,
} from '../src';

describe('shared schemas', () => {
  it('accepts a valid expense payload with recent date', () => {
    const payload = createExpenseSchema.parse({
      amount: 275.5,
      categoryId: 'category-1',
      description: 'Weekly groceries',
      paymentMethod: 'debit_card',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(payload.description).toBe('Weekly groceries');
  });

  it('rejects an expense date in the future', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = createExpenseSchema.safeParse({
      amount: 50,
      categoryId: 'category-1',
      description: 'Future dinner',
      paymentMethod: 'credit_card',
      date: futureDate,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/future/i);
    }
  });

  it('rejects an expense date older than 2 years', () => {
    const ancientDate = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const result = createExpenseSchema.safeParse({
      amount: 50,
      categoryId: 'category-1',
      description: 'Ancient expense',
      paymentMethod: 'credit_card',
      date: ancientDate,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/2 years/i);
    }
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
      phone: '+639123456789',
      password: 'Password1',
    });

    expect(result.success).toBe(false);
  });

  it('rejects emoji in auth fields', () => {
    const result = registerSchema.safeParse({
      name: 'Maya Tan',
      email: 'maya🙂@spendwise.app',
      phone: '+639123456789',
      password: `SecurePass1!${'a'.repeat(AUTH_PASSWORD_MIN_LENGTH - 12)}`,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid phone numbers on register', () => {
    const result = registerSchema.safeParse({
      name: 'Maya Tan',
      email: 'maya@spendwise.app',
      phone: `+${'1'.repeat(AUTH_PHONE_MAX_LENGTH + 1)}`,
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
