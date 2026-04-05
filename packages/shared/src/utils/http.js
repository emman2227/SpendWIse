"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withApiMeta = void 0;
const withApiMeta = (data) => ({
    data,
    meta: {
        timestamp: new Date().toISOString()
    }
});
exports.withApiMeta = withApiMeta;
//# sourceMappingURL=http.js.map