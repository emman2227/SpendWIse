"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = void 0;
const formatCurrency = (amount, locale = 'en-US', currency = 'PHP') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
//# sourceMappingURL=currency.js.map