'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.updateGoalSchema = exports.createGoalSchema = void 0;
const zod_1 = require('zod');
const common_1 = require('./common');
exports.createGoalSchema = zod_1.z.object({
  title: zod_1.z.string().min(2).max(120),
  targetAmount: zod_1.z.number().positive(),
  currentAmount: zod_1.z.number().min(0).default(0),
  targetDate: common_1.isoDateSchema,
  notes: zod_1.z.string().max(300).optional(),
});
exports.updateGoalSchema = exports.createGoalSchema.partial();
//# sourceMappingURL=goal.js.map
