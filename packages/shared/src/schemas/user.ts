import { z } from 'zod';

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  currency: z.string().optional(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete your account.'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Please type DELETE to confirm account deletion.' }),
  }),
});

export const clearUserDataSchema = z.object({
  password: z.string().min(1, 'Password is required to clear transaction data.'),
  confirmation: z.literal('CLEAR', {
    errorMap: () => ({ message: 'Please type CLEAR to confirm clearing transaction data.' }),
  }),
});
