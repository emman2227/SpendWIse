import { z } from 'zod';
export declare const insightSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["summary", "anomaly", "trend", "recommendation"]>;
    title: z.ZodString;
    message: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "summary" | "anomaly" | "trend" | "recommendation";
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}, {
    message: string;
    type: "summary" | "anomaly" | "trend" | "recommendation";
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}>;
//# sourceMappingURL=insight.d.ts.map