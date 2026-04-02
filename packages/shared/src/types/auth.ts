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

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}
