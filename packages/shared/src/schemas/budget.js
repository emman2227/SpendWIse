"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBudgetSchema = exports.createBudgetSchema = void 0;
const zod_1 = require("zod");
exports.createBudgetSchema = zod_1.z.object({
    categoryId: zod_1.z.string().min(1),
    limitAmount: zod_1.z.number().positive(),
    month: zod_1.z.number().int().min(1).max(12),
    year: zod_1.z.number().int().min(2000).max(3000)
});
exports.updateBudgetSchema = exports.createBudgetSchema.partial();
//# sourceMappingURL=budget.js.map