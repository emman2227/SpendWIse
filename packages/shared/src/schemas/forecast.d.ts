import { z } from 'zod';
export declare const forecastSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    period: z.ZodEnum<["weekly", "monthly", "quarterly"]>;
    predictedAmount: z.ZodNumber;
    confidence: z.ZodNumber;
    generatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    period: "weekly" | "monthly" | "quarterly";
    predictedAmount: number;
    confidence: number;
    generatedAt: string;
}, {
    id: string;
    userId: string;
    period: "weekly" | "monthly" | "quarterly";
    predictedAmount: number;
    confidence: number;
    generatedAt: string;
}>;
//# sourceMappingURL=forecast.d.ts.map