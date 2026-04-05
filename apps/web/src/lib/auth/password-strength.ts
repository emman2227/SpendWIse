import {
  AUTH_PASSWORD_MIN_LENGTH,
  authPasswordLowercasePattern,
  authPasswordNumberPattern,
  authPasswordSpecialCharacterPattern,
  authPasswordUppercasePattern,
} from '@spendwise/shared';

export interface PasswordChecklistItem {
  label: string;
  passed: boolean;
}

export interface PasswordStrengthResult {
  label: 'Weak' | 'Medium' | 'Strong';
  progress: number;
  status: 'danger' | 'warning' | 'safe';
  checklist: PasswordChecklistItem[];
}

export const getPasswordStrength = (password: string): PasswordStrengthResult => {
  const checklist = [
    {
      label: `${AUTH_PASSWORD_MIN_LENGTH}+ characters`,
      passed: password.length >= AUTH_PASSWORD_MIN_LENGTH,
    },
    {
      label: 'Uppercase letter',
      passed: authPasswordUppercasePattern.test(password),
    },
    {
      label: 'Lowercase letter',
      passed: authPasswordLowercasePattern.test(password),
    },
    {
      label: 'Number',
      passed: authPasswordNumberPattern.test(password),
    },
    {
      label: 'Special character',
      passed: authPasswordSpecialCharacterPattern.test(password),
    },
  ];

  const score = checklist.filter((item) => item.passed).length;
  const bonusPoint = password.length >= 16 && score >= 4 ? 1 : 0;
  const weightedScore = Math.min(6, score + bonusPoint);
  const progress = Math.round((weightedScore / 6) * 100);

  if (weightedScore >= 5) {
    return {
      label: 'Strong',
      progress,
      status: 'safe',
      checklist,
    };
  }

  if (weightedScore >= 3) {
    return {
      label: 'Medium',
      progress,
      status: 'warning',
      checklist,
    };
  }

  return {
    label: 'Weak',
    progress,
    status: 'danger',
    checklist,
  };
};
