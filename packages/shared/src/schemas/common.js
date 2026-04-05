"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.forecastPeriodSchema = exports.insightTypeSchema = exports.paymentMethodSchema = exports.isoDateSchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
const app_1 = require("../constants/app");
exports.objectIdSchema = zod_1.z.string().min(1);
exports.isoDateSchema = zod_1.z.string().datetime({ offset: true });
exports.paymentMethodSchema = zod_1.z.enum(app_1.PAYMENT_METHODS);
exports.insightTypeSchema = zod_1.z.enum(app_1.INSIGHT_TYPES);
exports.forecastPeriodSchema = zod_1.z.enum(app_1.FORECAST_PERIODS);
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20)
});
//# sourceMappingURL=common.js.map