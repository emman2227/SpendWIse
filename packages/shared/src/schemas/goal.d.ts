import type { z } from 'zod';
export declare const createGoalSchema: z.ZodObject<
  {
    title: z.ZodString;
    targetAmount: z.ZodNumber;
    currentAmount: z.ZodDefault<z.ZodNumber>;
    targetDate: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    title: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    notes?: string | undefined;
  },
  {
    title: string;
    targetAmount: number;
    targetDate: string;
    notes?: string | undefined;
    currentAmount?: number | undefined;
  }
>;
export declare const updateGoalSchema: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    targetAmount: z.ZodOptional<z.ZodNumber>;
    currentAmount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    targetDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    notes?: string | undefined;
    title?: string | undefined;
    targetAmount?: number | undefined;
    currentAmount?: number | undefined;
    targetDate?: string | undefined;
  },
  {
    notes?: string | undefined;
    title?: string | undefined;
    targetAmount?: number | undefined;
    currentAmount?: number | undefined;
    targetDate?: string | undefined;
  }
>;
//# sourceMappingURL=goal.d.ts.map
