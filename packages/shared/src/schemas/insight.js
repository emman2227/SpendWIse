"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insightSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.insightSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    type: common_1.insightTypeSchema,
    title: zod_1.z.string(),
    message: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string()
});
//# sourceMappingURL=insight.js.map