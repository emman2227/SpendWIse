"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseQuerySchema = exports.updateExpenseSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.createExpenseSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    categoryId: zod_1.z.string().min(1),
    description: zod_1.z.string().min(2).max(120),
    paymentMethod: common_1.paymentMethodSchema,
    date: zod_1.z.string().datetime({ offset: true }),
    notes: zod_1.z.string().max(300).optional()
});
exports.updateExpenseSchema = exports.createExpenseSchema.partial();
exports.expenseQuerySchema = zod_1.z.object({
    categoryId: zod_1.z.string().optional(),
    month: zod_1.z.coerce.number().int().min(1).max(12).optional(),
    year: zod_1.z.coerce.number().int().min(2000).max(3000).optional()
});
//# sourceMappingURL=expense.js.map