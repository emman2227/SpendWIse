import { z } from 'zod';
export declare const userProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    id: string;
    createdAt: string;
    updatedAt: string;
}, {
    name: string;
    email: string;
    id: string;
    createdAt: string;
    updatedAt: string;
}>;
//# sourceMappingURL=user.d.ts.map