import { z } from 'zod';

const booleanEnvSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  AI_PROVIDER: z.string().default('mock'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: booleanEnvSchema.default(true),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASS: z.string().trim().optional(),
  SMTP_FROM_EMAIL: z.string().trim().optional(),
  SMTP_FROM_NAME: z.string().trim().default('SpendWise'),
  EMAIL_VERIFICATION_CODE_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  PASSWORD_RESET_CODE_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
});

export type AppEnv = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>) => envSchema.parse(config);
