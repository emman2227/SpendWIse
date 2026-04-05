import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    icon: z.ZodDefault<z.ZodString>;
    color: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    icon: string;
    color: string;
}, {
    name: string;
    color: string;
    icon?: string | undefined;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    color: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
}, {
    name?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
}>;
//# sourceMappingURL=category.d.ts.map