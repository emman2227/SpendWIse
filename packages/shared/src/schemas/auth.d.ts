import { z } from 'zod';
export declare const AUTH_PASSWORD_MIN_LENGTH = 12;
export declare const AUTH_PASSWORD_MAX_LENGTH = 72;
export declare const AUTH_LOGIN_PASSWORD_MIN_LENGTH = 8;
export declare const authNamePattern: RegExp;
export declare const authNameSegmentPattern: RegExp;
export declare const authEmailPattern: RegExp;
export declare const authPasswordAllowedPattern: RegExp;
export declare const authPasswordUppercasePattern: RegExp;
export declare const authPasswordLowercasePattern: RegExp;
export declare const authPasswordNumberPattern: RegExp;
export declare const authPasswordSpecialCharacterPattern: RegExp;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
}, {
    name: string;
    email: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
//# sourceMappingURL=auth.d.ts.map