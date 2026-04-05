import { z } from 'zod';
export declare const createExpenseSchema: z.ZodObject<{
    amount: z.ZodNumber;
    categoryId: z.ZodString;
    description: z.ZodString;
    paymentMethod: z.ZodEnum<["cash", "credit_card", "debit_card", "bank_transfer", "e_wallet"]>;
    date: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    categoryId: string;
    amount: number;
    description: string;
    paymentMethod: "cash" | "credit_card" | "debit_card" | "bank_transfer" | "e_wallet";
    date: string;
    notes?: string | undefined;
}, {
    categoryId: string;
    amount: number;
    description: string;
    paymentMethod: "cash" | "credit_card" | "debit_card" | "bank_transfer" | "e_wallet";
    date: string;
    notes?: string | undefined;
}>;
export declare const updateExpenseSchema: z.ZodObject<{
    amount: z.ZodOptional<z.ZodNumber>;
    categoryId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["cash", "credit_card", "debit_card", "bank_transfer", "e_wallet"]>>;
    date: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    categoryId?: string | undefined;
    amount?: number | undefined;
    description?: string | undefined;
    paymentMethod?: "cash" | "credit_card" | "debit_card" | "bank_transfer" | "e_wallet" | undefined;
    date?: string | undefined;
    notes?: string | undefined;
}, {
    categoryId?: string | undefined;
    amount?: number | undefined;
    description?: string | undefined;
    paymentMethod?: "cash" | "credit_card" | "debit_card" | "bank_transfer" | "e_wallet" | undefined;
    date?: string | undefined;
    notes?: string | undefined;
}>;
export declare const expenseQuerySchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    month: z.ZodOptional<z.ZodNumber>;
    year: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    categoryId?: string | undefined;
    month?: number | undefined;
    year?: number | undefined;
}, {
    categoryId?: string | undefined;
    month?: number | undefined;
    year?: number | undefined;
}>;
//# sourceMappingURL=expense.d.ts.map