import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

import type { AuthSession, AuthTokens, JwtPayload } from '@spendwise/shared';

import { UsersRepository } from '../users/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: { name: string; email: string; password: string }): Promise<AuthSession> {
    const existing = await this.usersRepository.findByEmail(input.email);

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await hash(input.password, 12);
    const user = await this.usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash
    });

    const tokens = await this.issueTokens(user.id, user.email);
    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.usersRepository.updateRefreshToken(user.id, refreshTokenHash);

    return {
      user: this.usersRepository.toProfile(user),
      tokens
    };
  }

  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const user = await this.usersRepository.findByEmail(input.email);

    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.usersRepository.updateRefreshToken(user.id, refreshTokenHash);

    return {
      user: this.usersRepository.toProfile(user),
      tokens
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersRepository.findById(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh session not found');
    }

    const isValidRefresh = await compare(refreshToken, user.refreshTokenHash);

    if (!isValidRefresh) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.usersRepository.updateRefreshToken(user.id, refreshTokenHash);

    return {
      user: this.usersRepository.toProfile(user),
      tokens
    };
  }

  async logout(userId: string) {
    await this.usersRepository.updateRefreshToken(userId, undefined);
    return { success: true };
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessTtl = this.configService.getOrThrow<string>('JWT_ACCESS_TTL');
    const refreshTtl = this.configService.getOrThrow<string>('JWT_REFRESH_TTL');

    const accessPayload: JwtPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, type: 'refresh' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessTtl
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshTtl
      })
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60
    };
  }

  private verifyRefreshToken(refreshToken: string) {
    return this.jwtService
      .verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET')
      })
      .catch(() => {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      });
  }
}
