"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.forecastSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    period: common_1.forecastPeriodSchema,
    predictedAmount: zod_1.z.number().nonnegative(),
    confidence: zod_1.z.number().min(0).max(1),
    generatedAt: zod_1.z.string()
});
//# sourceMappingURL=forecast.js.map