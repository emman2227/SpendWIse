import { z } from 'zod';
export declare const createBudgetSchema: z.ZodObject<{
    categoryId: z.ZodString;
    limitAmount: z.ZodNumber;
    month: z.ZodNumber;
    year: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    limitAmount: number;
    month: number;
    year: number;
}, {
    categoryId: string;
    limitAmount: number;
    month: number;
    year: number;
}>;
export declare const updateBudgetSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    limitAmount: z.ZodOptional<z.ZodNumber>;
    month: z.ZodOptional<z.ZodNumber>;
    year: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    categoryId?: string | undefined;
    limitAmount?: number | undefined;
    month?: number | undefined;
    year?: number | undefined;
}, {
    categoryId?: string | undefined;
    limitAmount?: number | undefined;
    month?: number | undefined;
    year?: number | undefined;
}>;
//# sourceMappingURL=budget.d.ts.map