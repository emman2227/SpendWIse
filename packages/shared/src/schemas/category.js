"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
    icon: zod_1.z.string().min(1).max(30).default('wallet'),
    color: zod_1.z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Expected a hex color')
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
//# sourceMappingURL=category.js.map