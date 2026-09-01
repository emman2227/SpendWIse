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

  it('rejects an invalid or out-of-bounds amount', () => {
    const validBase = {
      categoryId: 'category-1',
      description: 'Supermarket',
      paymentMethod: 'debit_card',
      date: new Date().toISOString(),
    };

    expect(createExpenseSchema.safeParse({ ...validBase, amount: 0 }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...validBase, amount: -10 }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...validBase, amount: 150_000_000 }).success).toBe(
      false,
    );
    expect(createExpenseSchema.safeParse({ ...validBase, amount: 99.99 }).success).toBe(true);
  });

  it('rejects descriptions exceeding 120 characters or containing control characters', () => {
    const validBase = {
      amount: 45,
      categoryId: 'category-1',
      paymentMethod: 'debit_card',
      date: new Date().toISOString(),
    };

    // > 120 chars
    expect(
      createExpenseSchema.safeParse({
        ...validBase,
        description: 'A'.repeat(121),
      }).success,
    ).toBe(false);

    // Control characters / null bytes
    expect(
      createExpenseSchema.safeParse({
        ...validBase,
        description: 'Coffee\x00Shop',
      }).success,
    ).toBe(false);

    expect(
      createExpenseSchema.safeParse({
        ...validBase,
        description: 'Coffee\x1FShop',
      }).success,
    ).toBe(false);

    // Valid 120 chars
    expect(
      createExpenseSchema.safeParse({
        ...validBase,
        description: 'A'.repeat(120),
      }).success,
    ).toBe(true);
  });

  it('rejects notes exceeding 200 characters or containing control characters', () => {
    const validBase = {
      amount: 45,
      categoryId: 'category-1',
      description: 'Lunch meeting',
      paymentMethod: 'debit_card',
      date: new Date().toISOString(),
    };

    // > 200 chars
    expect(
      createExpenseSchema.safeParse({
        ...validBase,
        notes: 'N'.repeat(201),
      }).success,
    ).toBe(false);

    // Control character
    expect(
      createExpenseSchema.safeParse({
        ...validBase,
        notes: 'Meeting\x00notes',
      }).success,
    ).toBe(false);

    // Valid 200 chars
    expect(
      createExpenseSchema.safeParse({
        ...validBase,
        notes: 'N'.repeat(200),
      }).success,
    ).toBe(true);
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
