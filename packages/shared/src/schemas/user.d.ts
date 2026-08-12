import type { z } from 'zod';
export declare const userProfileSchema: z.ZodObject<
  {
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    emailVerified: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    name: string;
    email: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    emailVerified: boolean;
    phone?: string | undefined;
  },
  {
    name: string;
    email: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    emailVerified: boolean;
    phone?: string | undefined;
  }
>;
//# sourceMappingURL=user.d.ts.map
