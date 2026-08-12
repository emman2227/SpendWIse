'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.updateNotificationPreferencesSchema =
  exports.defaultNotificationPreferences =
  exports.NOTIFICATION_PREFERENCE_KEYS =
    void 0;
const zod_1 = require('zod');
exports.NOTIFICATION_PREFERENCE_KEYS = [
  'budget',
  'ai',
  'forecast',
  'recurring',
  'goal',
  'transaction',
];
exports.defaultNotificationPreferences = {
  budget: true,
  ai: true,
  forecast: true,
  recurring: true,
  goal: true,
  transaction: true,
};
exports.updateNotificationPreferencesSchema = zod_1.z.object({
  budget: zod_1.z.boolean().optional(),
  ai: zod_1.z.boolean().optional(),
  forecast: zod_1.z.boolean().optional(),
  recurring: zod_1.z.boolean().optional(),
  goal: zod_1.z.boolean().optional(),
  transaction: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=notification-preferences.js.map
