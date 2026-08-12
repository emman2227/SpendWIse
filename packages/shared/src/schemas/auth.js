'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.updateProfileSchema =
  exports.resetPasswordWithCodeSchema =
  exports.changePasswordWithOtpSchema =
  exports.requestPasswordChangeOtpSchema =
  exports.verifyPasswordResetCodeSchema =
  exports.requestPasswordResetSchema =
  exports.resendVerificationCodeSchema =
  exports.verifyEmailSchema =
  exports.refreshTokenSchema =
  exports.loginSchema =
  exports.registerSchema =
  exports.authPasswordSpecialCharacterPattern =
  exports.authPasswordNumberPattern =
  exports.authPasswordLowercasePattern =
  exports.authPasswordUppercasePattern =
  exports.authPasswordAllowedPattern =
  exports.authPhonePattern =
  exports.authEmailPattern =
  exports.authNameSegmentPattern =
  exports.authNamePattern =
  exports.AUTH_PHONE_MAX_LENGTH =
  exports.AUTH_PHONE_MIN_LENGTH =
  exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH =
  exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH =
  exports.AUTH_PASSWORD_MAX_LENGTH =
  exports.AUTH_PASSWORD_MIN_LENGTH =
    void 0;
const zod_1 = require('zod');
exports.AUTH_PASSWORD_MIN_LENGTH = 12;
exports.AUTH_PASSWORD_MAX_LENGTH = 72;
exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH = 8;
exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH = 6;
exports.AUTH_PHONE_MIN_LENGTH = 10;
exports.AUTH_PHONE_MAX_LENGTH = 15;
exports.authNamePattern = /^[A-Za-z]+(?:['-][A-Za-z]+)*(?: [A-Za-z]+(?:['-][A-Za-z]+)*)*$/;
exports.authNameSegmentPattern = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;
exports.authEmailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
exports.authPhonePattern = /^\+?[0-9]{10,15}$/;
exports.authPasswordAllowedPattern = /^[!-~]+$/;
exports.authPasswordUppercasePattern = /[A-Z]/;
exports.authPasswordLowercasePattern = /[a-z]/;
exports.authPasswordNumberPattern = /[0-9]/;
exports.authPasswordSpecialCharacterPattern = /[^A-Za-z0-9]/;
const emailSchema = zod_1.z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .max(320, 'Email is too long.')
  .regex(exports.authEmailPattern, 'Use a valid email address without spaces or emoji.');
const passwordCharacterSchema = zod_1.z
  .string()
  .min(1)
  .regex(exports.authPasswordAllowedPattern, 'Password cannot include spaces or emoji.');
const phoneSchema = zod_1.z
  .string()
  .trim()
  .min(1, 'Phone number is required.')
  .regex(
    exports.authPhonePattern,
    `Use a valid phone number with ${exports.AUTH_PHONE_MIN_LENGTH}-${exports.AUTH_PHONE_MAX_LENGTH} digits.`,
  );
const strongPasswordSchema = passwordCharacterSchema
  .min(
    exports.AUTH_PASSWORD_MIN_LENGTH,
    `Password must be at least ${exports.AUTH_PASSWORD_MIN_LENGTH} characters.`,
  )
  .max(
    exports.AUTH_PASSWORD_MAX_LENGTH,
    `Password must be at most ${exports.AUTH_PASSWORD_MAX_LENGTH} characters.`,
  )
  .regex(
    exports.authPasswordUppercasePattern,
    'Password must include at least one uppercase letter.',
  )
  .regex(
    exports.authPasswordLowercasePattern,
    'Password must include at least one lowercase letter.',
  )
  .regex(exports.authPasswordNumberPattern, 'Password must include at least one number.')
  .regex(
    exports.authPasswordSpecialCharacterPattern,
    'Password must include at least one special character.',
  );
exports.registerSchema = zod_1.z.object({
  name: zod_1.z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.')
    .regex(exports.authNamePattern, 'Name can only use letters, spaces, apostrophes, and hyphens.'),
  email: emailSchema,
  phone: phoneSchema,
  password: strongPasswordSchema,
});
exports.loginSchema = zod_1.z.object({
  email: emailSchema,
  password: passwordCharacterSchema
    .min(
      exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH,
      `Password must be at least ${exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH} characters.`,
    )
    .max(
      exports.AUTH_PASSWORD_MAX_LENGTH,
      `Password must be at most ${exports.AUTH_PASSWORD_MAX_LENGTH} characters.`,
    ),
});
exports.refreshTokenSchema = zod_1.z.object({
  refreshToken: zod_1.z.string().min(20),
});
exports.verifyEmailSchema = zod_1.z.object({
  email: emailSchema,
  code: zod_1.z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH}}$`),
      `Enter the ${exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`,
    ),
});
exports.resendVerificationCodeSchema = zod_1.z.object({
  email: emailSchema,
});
exports.requestPasswordResetSchema = zod_1.z.object({
  email: emailSchema,
});
exports.verifyPasswordResetCodeSchema = zod_1.z.object({
  email: emailSchema,
  code: zod_1.z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH}}$`),
      `Enter the ${exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`,
    ),
});
exports.requestPasswordChangeOtpSchema = zod_1.z.object({
  currentPassword: passwordCharacterSchema
    .min(
      exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH,
      `Password must be at least ${exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH} characters.`,
    )
    .max(
      exports.AUTH_PASSWORD_MAX_LENGTH,
      `Password must be at most ${exports.AUTH_PASSWORD_MAX_LENGTH} characters.`,
    ),
});
exports.changePasswordWithOtpSchema = zod_1.z
  .object({
    currentPassword: passwordCharacterSchema
      .min(
        exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH,
        `Password must be at least ${exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH} characters.`,
      )
      .max(
        exports.AUTH_PASSWORD_MAX_LENGTH,
        `Password must be at most ${exports.AUTH_PASSWORD_MAX_LENGTH} characters.`,
      ),
    code: zod_1.z
      .string()
      .trim()
      .regex(
        new RegExp(`^\\d{${exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH}}$`),
        `Enter the ${exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`,
      ),
    password: strongPasswordSchema,
  })
  .refine((value) => value.password !== value.currentPassword, {
    message: 'Choose a new password that is different from your current password.',
    path: ['password'],
  });
exports.resetPasswordWithCodeSchema = zod_1.z.object({
  email: emailSchema,
  code: zod_1.z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{${exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH}}$`),
      `Enter the ${exports.AUTH_EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`,
    ),
  password: strongPasswordSchema,
});
exports.updateProfileSchema = zod_1.z
  .object({
    name: zod_1.z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(80, 'Name must be at most 80 characters.')
      .regex(
        exports.authNamePattern,
        'Name can only use letters, spaces, apostrophes, and hyphens.',
      )
      .optional(),
    phone: phoneSchema.optional(),
    currency: zod_1.z.string().length(3, 'Currency must be a 3-letter code.').optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.phone !== undefined || data.currency !== undefined,
    {
      message: 'At least one field must be provided.',
    },
  );
//# sourceMappingURL=auth.js.map
