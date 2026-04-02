import { describe, expect, it } from 'vitest';

import { createExpenseSchema, loginSchema } from '../src';

describe('shared schemas', () => {
  it('accepts a valid expense payload', () => {
    const payload = createExpenseSchema.parse({
      amount: 275.5,
      categoryId: 'category-1',
      description: 'Weekly groceries',
      paymentMethod: 'debit_card',
      date: '2026-04-02T10:30:00.000Z'
    });

    expect(payload.description).toBe('Weekly groceries');
  });

  it('rejects an invalid email on login', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123'
    });

    expect(result.success).toBe(false);
  });
});
