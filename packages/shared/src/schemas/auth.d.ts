import type { z } from 'zod';
export declare const AUTH_PASSWORD_MIN_LENGTH = 12;
export declare const AUTH_PASSWORD_MAX_LENGTH = 72;
export declare const AUTH_LOGIN_PASSWORD_MIN_LENGTH = 8;
export declare const AUTH_EMAIL_VERIFICATION_CODE_LENGTH = 6;
export declare const AUTH_PHONE_MIN_LENGTH = 10;
export declare const AUTH_PHONE_MAX_LENGTH = 15;
export declare const authNamePattern: RegExp;
export declare const authNameSegmentPattern: RegExp;
export declare const authEmailPattern: RegExp;
export declare const authPhonePattern: RegExp;
export declare const authPasswordAllowedPattern: RegExp;
export declare const authPasswordUppercasePattern: RegExp;
export declare const authPasswordLowercasePattern: RegExp;
export declare const authPasswordNumberPattern: RegExp;
export declare const authPasswordSpecialCharacterPattern: RegExp;
export declare const registerSchema: z.ZodObject<
  {
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    password: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    name: string;
    email: string;
    phone: string;
    password: string;
  },
  {
    name: string;
    email: string;
    phone: string;
    password: string;
  }
>;
export declare const loginSchema: z.ZodObject<
  {
    email: z.ZodString;
    password: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    email: string;
    password: string;
  },
  {
    email: string;
    password: string;
  }
>;
export declare const refreshTokenSchema: z.ZodObject<
  {
    refreshToken: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    refreshToken: string;
  },
  {
    refreshToken: string;
  }
>;
export declare const verifyEmailSchema: z.ZodObject<
  {
    email: z.ZodString;
    code: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    email: string;
    code: string;
  },
  {
    email: string;
    code: string;
  }
>;
export declare const resendVerificationCodeSchema: z.ZodObject<
  {
    email: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    email: string;
  },
  {
    email: string;
  }
>;
export declare const requestPasswordResetSchema: z.ZodObject<
  {
    email: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    email: string;
  },
  {
    email: string;
  }
>;
export declare const verifyPasswordResetCodeSchema: z.ZodObject<
  {
    email: z.ZodString;
    code: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    email: string;
    code: string;
  },
  {
    email: string;
    code: string;
  }
>;
export declare const requestPasswordChangeOtpSchema: z.ZodObject<
  {
    currentPassword: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    currentPassword: string;
  },
  {
    currentPassword: string;
  }
>;
export declare const changePasswordWithOtpSchema: z.ZodEffects<
  z.ZodObject<
    {
      currentPassword: z.ZodString;
      code: z.ZodString;
      password: z.ZodString;
    },
    'strip',
    z.ZodTypeAny,
    {
      password: string;
      code: string;
      currentPassword: string;
    },
    {
      password: string;
      code: string;
      currentPassword: string;
    }
  >,
  {
    password: string;
    code: string;
    currentPassword: string;
  },
  {
    password: string;
    code: string;
    currentPassword: string;
  }
>;
export declare const resetPasswordWithCodeSchema: z.ZodObject<
  {
    email: z.ZodString;
    code: z.ZodString;
    password: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    email: string;
    password: string;
    code: string;
  },
  {
    email: string;
    password: string;
    code: string;
  }
>;
export declare const updateProfileSchema: z.ZodEffects<
  z.ZodObject<
    {
      name: z.ZodOptional<z.ZodString>;
      phone: z.ZodOptional<z.ZodString>;
      currency: z.ZodOptional<z.ZodString>;
    },
    'strip',
    z.ZodTypeAny,
    {
      name?: string | undefined;
      phone?: string | undefined;
      currency?: string | undefined;
    },
    {
      name?: string | undefined;
      phone?: string | undefined;
      currency?: string | undefined;
    }
  >,
  {
    name?: string | undefined;
    phone?: string | undefined;
    currency?: string | undefined;
  },
  {
    name?: string | undefined;
    phone?: string | undefined;
    currency?: string | undefined;
  }
>;
//# sourceMappingURL=auth.d.ts.map
