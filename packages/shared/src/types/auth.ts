import type { UserProfile } from './entities';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
}

export type VerificationDeliveryMethod = 'smtp' | 'log';

export interface RegisterResult {
  user: UserProfile;
  requiresEmailVerification: true;
  verificationDeliveryMethod: VerificationDeliveryMethod;
}

export interface VerificationDispatchResult {
  success: true;
  email: string;
  verificationDeliveryMethod: VerificationDeliveryMethod;
}

export interface CodeVerificationResult {
  success: true;
  email: string;
}

export interface PasswordResetResult {
  success: true;
}

export interface PasswordChangeResult {
  success: true;
  requiresReauthentication: true;
}

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}
