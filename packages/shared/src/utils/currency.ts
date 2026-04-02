export const formatCurrency = (
  amount: number,
  locale = 'en-US',
  currency = 'PHP',
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amount);
};
