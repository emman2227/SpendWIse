import { z } from 'zod';
export declare const objectIdSchema: z.ZodString;
export declare const isoDateSchema: z.ZodString;
export declare const paymentMethodSchema: z.ZodEnum<["cash", "credit_card", "debit_card", "bank_transfer", "e_wallet"]>;
export declare const insightTypeSchema: z.ZodEnum<["summary", "anomaly", "trend", "recommendation"]>;
export declare const forecastPeriodSchema: z.ZodEnum<["weekly", "monthly", "quarterly"]>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
//# sourceMappingURL=common.d.ts.map