import {
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PHONE_MAX_LENGTH,
  authPasswordAllowedPattern,
} from '@spendwise/shared';

const singleNameCharacterPattern = /[A-Za-z'-]/;
const emailCharacterPattern = /[A-Za-z0-9._%+\-@]/;
const phoneCharacterPattern = /[0-9+]/;

const sanitizeWithPattern = (value: string, pattern: RegExp, maxLength: number) =>
  Array.from(value)
    .filter((character) => pattern.test(character))
    .join('')
    .slice(0, maxLength);

export const sanitizeNameInput = (value: string) =>
  sanitizeWithPattern(value, singleNameCharacterPattern, 40);

export const sanitizeEmailInput = (value: string) =>
  sanitizeWithPattern(value.toLowerCase(), emailCharacterPattern, 320);

export const sanitizePhoneInput = (value: string) => {
  const nextValue = sanitizeWithPattern(value, phoneCharacterPattern, AUTH_PHONE_MAX_LENGTH + 1);

  if (!nextValue.startsWith('+')) {
    return nextValue.replace(/\+/g, '');
  }

  return `+${nextValue.slice(1).replace(/\+/g, '')}`;
};

export const sanitizePasswordInput = (value: string) =>
  Array.from(value)
    .filter((character) => authPasswordAllowedPattern.test(character))
    .join('')
    .slice(0, AUTH_PASSWORD_MAX_LENGTH);
