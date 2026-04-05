"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentMonthYear = exports.formatShortDate = void 0;
const formatShortDate = (value, locale = 'en-US') => {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
};
exports.formatShortDate = formatShortDate;
const getCurrentMonthYear = () => {
    const now = new Date();
    return {
        month: now.getUTCMonth() + 1,
        year: now.getUTCFullYear()
    };
};
exports.getCurrentMonthYear = getCurrentMonthYear;
//# sourceMappingURL=date.js.map