'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.userProfileSchema = void 0;
const zod_1 = require('zod');
exports.userProfileSchema = zod_1.z.object({
  id: zod_1.z.string(),
  name: zod_1.z.string(),
  email: zod_1.z.string().email(),
  phone: zod_1.z.string().optional(),
  emailVerified: zod_1.z.boolean(),
  createdAt: zod_1.z.string(),
  updatedAt: zod_1.z.string(),
});
//# sourceMappingURL=user.js.map
