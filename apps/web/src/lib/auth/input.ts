import {
  AUTH_PASSWORD_MAX_LENGTH,
  authPasswordAllowedPattern,
} from '@spendwise/shared';

const singleNameCharacterPattern = /[A-Za-z'-]/;
const emailCharacterPattern = /[A-Za-z0-9._%+\-@]/;

const sanitizeWithPattern = (value: string, pattern: RegExp, maxLength: number) =>
  Array.from(value)
    .filter((character) => pattern.test(character))
    .join('')
    .slice(0, maxLength);

export const sanitizeNameInput = (value: string) =>
  sanitizeWithPattern(value, singleNameCharacterPattern, 40);

export const sanitizeEmailInput = (value: string) =>
  sanitizeWithPattern(value.toLowerCase(), emailCharacterPattern, 320);

export const sanitizePasswordInput = (value: string) =>
  Array.from(value)
    .filter((character) => authPasswordAllowedPattern.test(character))
    .join('')
    .slice(0, AUTH_PASSWORD_MAX_LENGTH);
