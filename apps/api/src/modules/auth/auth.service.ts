import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type {
  AuthSession,
  AuthTokens,
  CodeVerificationResult,
  JwtPayload,
  PasswordResetResult,
  RegisterResult,
  VerificationDeliveryMethod,
  VerificationDispatchResult,
} from '@spendwise/shared';
import { compare, hash } from 'bcryptjs';
import { randomInt } from 'crypto';

import type { MailService } from '../mail/mail.service';
import type { UserDocument } from '../users/user.schema';
import type { UsersRepository } from '../users/users.repository';

const ttlToSeconds = (value: string) => {
  const match = value.trim().match(/^(\d+)([smhd])?$/i);

  if (!match) {
    return 15 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? 's';

  switch (unit) {
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    case 's':
    default:
      return amount;
  }
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<RegisterResult> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const trimmedName = input.name.trim();
    const normalizedPhone = input.phone.trim();
    const existing = await this.usersRepository.findByEmail(normalizedEmail);
    const passwordHash = await hash(input.password, 12);

    let user: UserDocument;

    if (existing) {
      if (existing.emailVerified) {
        throw new ConflictException('An account with this email already exists');
      }

      const updatedUser = await this.usersRepository.updatePendingRegistration(existing.id, {
        name: trimmedName,
        phone: normalizedPhone,
        passwordHash,
      });

      if (!updatedUser) {
        throw new UnauthorizedException('Unable to continue registration for this account');
      }

      user = updatedUser;
    } else {
      user = await this.usersRepository.create({
        name: trimmedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
      });
    }

    const verificationDeliveryMethod = await this.sendEmailVerificationCode(user);

    return {
      user: this.usersRepository.toProfile(user),
      requiresEmailVerification: true,
      verificationDeliveryMethod,
    };
  }

  async verifyEmail(input: { email: string; code: string }): Promise<AuthSession> {
    const user = await this.usersRepository.findByEmail(input.email.trim().toLowerCase());

    if (!user) {
      throw new BadRequestException('This verification request is no longer valid.');
    }

    if (user.emailVerified) {
      throw new ConflictException('This email is already verified. Please sign in.');
    }

    await this.assertEmailVerificationCode(user, input.code);

    const verifiedUser = await this.usersRepository.markEmailVerified(user.id);

    if (!verifiedUser) {
      throw new UnauthorizedException('Unable to verify this account');
    }

    return this.createAuthenticatedSession(verifiedUser.id, verifiedUser.email);
  }

  async resendVerificationCode(input: { email: string }): Promise<VerificationDispatchResult> {
    const user = await this.usersRepository.findByEmail(input.email.trim().toLowerCase());

    if (!user) {
      throw new BadRequestException('No account was found for this email address.');
    }

    if (user.emailVerified) {
      throw new ConflictException('This email is already verified. Please sign in.');
    }

    const verificationDeliveryMethod = await this.sendEmailVerificationCode(user, {
      enforceCooldown: true,
    });

    return {
      success: true,
      email: user.email,
      verificationDeliveryMethod,
    };
  }

  async requestPasswordReset(input: { email: string }): Promise<VerificationDispatchResult> {
    const user = await this.usersRepository.findByEmail(input.email.trim().toLowerCase());

    if (!user || !user.emailVerified) {
      throw new BadRequestException('No verified account was found for this email address.');
    }

    const verificationDeliveryMethod = await this.sendPasswordResetCode(user, {
      enforceCooldown: true,
    });

    return {
      success: true,
      email: user.email,
      verificationDeliveryMethod,
    };
  }

  async verifyPasswordResetCode(input: {
    email: string;
    code: string;
  }): Promise<CodeVerificationResult> {
    const user = await this.getResettableUser(input.email);

    await this.assertPasswordResetCode(user, input.code);

    return {
      success: true,
      email: user.email,
    };
  }

  async resetPassword(input: {
    email: string;
    code: string;
    password: string;
  }): Promise<PasswordResetResult> {
    const user = await this.getResettableUser(input.email);

    await this.assertPasswordResetCode(user, input.code);

    const passwordHash = await hash(input.password, 12);
    const updatedUser = await this.usersRepository.updatePassword(user.id, passwordHash);

    if (!updatedUser) {
      throw new UnauthorizedException('Unable to reset this password.');
    }

    return {
      success: true,
    };
  }

  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const user = await this.usersRepository.findByEmail(input.email.trim().toLowerCase());

    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Verify your email before signing in.');
    }

    return this.createAuthenticatedSession(user.id, user.email);
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
      tokens,
    };
  }

  async logout(userId: string) {
    await this.usersRepository.updateRefreshToken(userId, undefined);
    return { success: true };
  }

  private async getResettableUser(email: string) {
    const user = await this.usersRepository.findByEmail(email.trim().toLowerCase());

    if (!user || !user.emailVerified) {
      throw new BadRequestException('No verified account was found for this email address.');
    }

    return user;
  }

  private async createAuthenticatedSession(userId: string, email: string): Promise<AuthSession> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueTokens(user.id, email);
    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    await this.usersRepository.updateRefreshToken(user.id, refreshTokenHash);

    return {
      user: this.usersRepository.toProfile(user),
      tokens,
    };
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
        expiresIn: accessTtl,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshTtl,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: ttlToSeconds(accessTtl),
    };
  }

  private verifyRefreshToken(refreshToken: string) {
    return this.jwtService
      .verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
      .catch(() => {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      });
  }

  private async assertEmailVerificationCode(user: UserDocument, code: string) {
    if (!user.emailVerificationCodeHash || !user.emailVerificationCodeExpiresAt) {
      throw new BadRequestException('Request a new verification code to continue.');
    }

    if (user.emailVerificationCodeExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Your verification code has expired. Request a new one.');
    }

    const isValidCode = await compare(code.trim(), user.emailVerificationCodeHash);

    if (!isValidCode) {
      throw new BadRequestException('That verification code is incorrect.');
    }
  }

  private async assertPasswordResetCode(user: UserDocument, code: string) {
    if (!user.passwordResetCodeHash || !user.passwordResetCodeExpiresAt) {
      throw new BadRequestException('Request a new password reset code to continue.');
    }

    if (user.passwordResetCodeExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Your password reset code has expired. Request a new one.');
    }

    const isValidCode = await compare(code.trim(), user.passwordResetCodeHash);

    if (!isValidCode) {
      throw new BadRequestException('That password reset code is incorrect.');
    }
  }

  private async sendEmailVerificationCode(
    user: UserDocument,
    options: { enforceCooldown?: boolean } = {},
  ): Promise<VerificationDeliveryMethod> {
    const sentAt = new Date();

    this.assertCodeCooldown(
      user.emailVerificationSentAt,
      sentAt,
      this.configService.getOrThrow<number>('EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS'),
      options.enforceCooldown,
    );

    const expiresInMinutes = this.configService.getOrThrow<number>(
      'EMAIL_VERIFICATION_CODE_TTL_MINUTES',
    );
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await hash(code, 10);
    const expiresAt = new Date(sentAt.getTime() + expiresInMinutes * 60 * 1000);

    await this.usersRepository.updateEmailVerification(user.id, {
      codeHash,
      expiresAt,
      sentAt,
    });

    return this.mailService.sendVerificationCode({
      code,
      expiresInMinutes,
      name: user.name,
      to: user.email,
    });
  }

  private async sendPasswordResetCode(
    user: UserDocument,
    options: { enforceCooldown?: boolean } = {},
  ): Promise<VerificationDeliveryMethod> {
    const sentAt = new Date();

    this.assertCodeCooldown(
      user.passwordResetSentAt,
      sentAt,
      this.configService.getOrThrow<number>('PASSWORD_RESET_RESEND_COOLDOWN_SECONDS'),
      options.enforceCooldown,
    );

    const expiresInMinutes = this.configService.getOrThrow<number>(
      'PASSWORD_RESET_CODE_TTL_MINUTES',
    );
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await hash(code, 10);
    const expiresAt = new Date(sentAt.getTime() + expiresInMinutes * 60 * 1000);

    await this.usersRepository.updatePasswordReset(user.id, {
      codeHash,
      expiresAt,
      sentAt,
    });

    return this.mailService.sendPasswordResetCode({
      code,
      expiresInMinutes,
      name: user.name,
      to: user.email,
    });
  }

  private assertCodeCooldown(
    previousSentAt: Date | undefined,
    nextSentAt: Date,
    cooldownSeconds: number,
    enforceCooldown?: boolean,
  ) {
    if (!enforceCooldown || !previousSentAt) {
      return;
    }

    const nextAllowedAt = previousSentAt.getTime() + cooldownSeconds * 1000;

    if (nextAllowedAt <= nextSentAt.getTime()) {
      return;
    }

    const remainingSeconds = Math.max(1, Math.ceil((nextAllowedAt - nextSentAt.getTime()) / 1000));

    throw new HttpException(
      `Please wait ${remainingSeconds} seconds before requesting another code.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
