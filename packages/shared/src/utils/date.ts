export const formatShortDate = (value: string | Date, locale = 'en-US'): string => {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const getCurrentMonthYear = () => {
  const now = new Date();

  return {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear()
  };
};
