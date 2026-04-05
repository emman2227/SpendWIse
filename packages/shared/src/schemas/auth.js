"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = exports.authPasswordSpecialCharacterPattern = exports.authPasswordNumberPattern = exports.authPasswordLowercasePattern = exports.authPasswordUppercasePattern = exports.authPasswordAllowedPattern = exports.authEmailPattern = exports.authNameSegmentPattern = exports.authNamePattern = exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH = exports.AUTH_PASSWORD_MAX_LENGTH = exports.AUTH_PASSWORD_MIN_LENGTH = void 0;
const zod_1 = require("zod");
exports.AUTH_PASSWORD_MIN_LENGTH = 12;
exports.AUTH_PASSWORD_MAX_LENGTH = 72;
exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH = 8;
exports.authNamePattern = /^[A-Za-z]+(?:['-][A-Za-z]+)*(?: [A-Za-z]+(?:['-][A-Za-z]+)*)*$/;
exports.authNameSegmentPattern = /^[A-Za-z]+(?:['-][A-Za-z]+)*$/;
exports.authEmailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
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
const strongPasswordSchema = passwordCharacterSchema
    .min(exports.AUTH_PASSWORD_MIN_LENGTH, `Password must be at least ${exports.AUTH_PASSWORD_MIN_LENGTH} characters.`)
    .max(exports.AUTH_PASSWORD_MAX_LENGTH, `Password must be at most ${exports.AUTH_PASSWORD_MAX_LENGTH} characters.`)
    .regex(exports.authPasswordUppercasePattern, 'Password must include at least one uppercase letter.')
    .regex(exports.authPasswordLowercasePattern, 'Password must include at least one lowercase letter.')
    .regex(exports.authPasswordNumberPattern, 'Password must include at least one number.')
    .regex(exports.authPasswordSpecialCharacterPattern, 'Password must include at least one special character.');
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters.')
        .max(80, 'Name must be at most 80 characters.')
        .regex(exports.authNamePattern, 'Name can only use letters, spaces, apostrophes, and hyphens.'),
    email: emailSchema,
    password: strongPasswordSchema
});
exports.loginSchema = zod_1.z.object({
    email: emailSchema,
    password: passwordCharacterSchema
        .min(exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH, `Password must be at least ${exports.AUTH_LOGIN_PASSWORD_MIN_LENGTH} characters.`)
        .max(exports.AUTH_PASSWORD_MAX_LENGTH, `Password must be at most ${exports.AUTH_PASSWORD_MAX_LENGTH} characters.`)
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(20)
});
//# sourceMappingURL=auth.js.map