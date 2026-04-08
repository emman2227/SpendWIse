import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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

import { AuditLogService } from '../../common/services/audit-log.service';
import { MailService } from '../mail/mail.service';
import type { UserDocument } from '../users/user.schema';
import { UsersRepository } from '../users/users.repository';

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
    @Inject(UsersRepository)
    private readonly usersRepository: UsersRepository,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(MailService)
    private readonly mailService: MailService,
    @Inject(AuditLogService)
    private readonly auditLogService: AuditLogService,
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

    try {
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

      this.auditLogService.record({
        action: 'auth.register',
        email: user.email,
        metadata: {
          verificationDeliveryMethod,
        },
        outcome: 'success',
        userId: user.id,
      });

      return {
        user: this.usersRepository.toProfile(user),
        requiresEmailVerification: true,
        verificationDeliveryMethod,
      };
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.register',
        email: normalizedEmail,
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
      });
      throw error;
    }
  }

  async verifyEmail(input: { email: string; code: string }): Promise<AuthSession> {
    const normalizedEmail = input.email.trim().toLowerCase();

    try {
      const user = await this.usersRepository.findByEmail(normalizedEmail);

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

      const session = await this.createAuthenticatedSession(verifiedUser.id, verifiedUser.email);

      this.auditLogService.record({
        action: 'auth.verify_email',
        email: verifiedUser.email,
        outcome: 'success',
        userId: verifiedUser.id,
      });

      return session;
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.verify_email',
        email: normalizedEmail,
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
      });
      throw error;
    }
  }

  async resendVerificationCode(input: { email: string }): Promise<VerificationDispatchResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    try {
      const user = await this.usersRepository.findByEmail(normalizedEmail);

      if (!user) {
        throw new BadRequestException('No account was found for this email address.');
      }

      if (user.emailVerified) {
        throw new ConflictException('This email is already verified. Please sign in.');
      }

      const verificationDeliveryMethod = await this.sendEmailVerificationCode(user, {
        enforceCooldown: true,
      });

      this.auditLogService.record({
        action: 'auth.resend_verification_code',
        email: user.email,
        metadata: {
          verificationDeliveryMethod,
        },
        outcome: 'success',
        userId: user.id,
      });

      return {
        success: true,
        email: user.email,
        verificationDeliveryMethod,
      };
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.resend_verification_code',
        email: normalizedEmail,
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
      });
      throw error;
    }
  }

  async requestPasswordReset(input: { email: string }): Promise<VerificationDispatchResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    try {
      const user = await this.usersRepository.findByEmail(normalizedEmail);

      if (!user || !user.emailVerified) {
        throw new BadRequestException('No verified account was found for this email address.');
      }

      const verificationDeliveryMethod = await this.sendPasswordResetCode(user, {
        enforceCooldown: true,
      });

      this.auditLogService.record({
        action: 'auth.request_password_reset',
        email: user.email,
        metadata: {
          verificationDeliveryMethod,
        },
        outcome: 'success',
        userId: user.id,
      });

      return {
        success: true,
        email: user.email,
        verificationDeliveryMethod,
      };
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.request_password_reset',
        email: normalizedEmail,
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
      });
      throw error;
    }
  }

  async verifyPasswordResetCode(input: {
    email: string;
    code: string;
  }): Promise<CodeVerificationResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    try {
      const user = await this.getResettableUser(normalizedEmail);

      await this.assertPasswordResetCode(user, input.code);

      this.auditLogService.record({
        action: 'auth.verify_password_reset_code',
        email: user.email,
        outcome: 'success',
        userId: user.id,
      });

      return {
        success: true,
        email: user.email,
      };
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.verify_password_reset_code',
        email: normalizedEmail,
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
      });
      throw error;
    }
  }

  async resetPassword(input: {
    email: string;
    code: string;
    password: string;
  }): Promise<PasswordResetResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    try {
      const user = await this.getResettableUser(normalizedEmail);

      await this.assertPasswordResetCode(user, input.code);

      const passwordHash = await hash(input.password, 12);
      const updatedUser = await this.usersRepository.updatePassword(user.id, passwordHash);

      if (!updatedUser) {
        throw new UnauthorizedException('Unable to reset this password.');
      }

      this.auditLogService.record({
        action: 'auth.reset_password',
        email: updatedUser.email,
        outcome: 'success',
        userId: updatedUser.id,
      });

      return {
        success: true,
      };
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.reset_password',
        email: normalizedEmail,
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
      });
      throw error;
    }
  }

  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const normalizedEmail = input.email.trim().toLowerCase();

    try {
      const user = await this.usersRepository.findByEmail(normalizedEmail);

      if (!user || !(await compare(input.password, user.passwordHash))) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.emailVerified) {
        throw new ForbiddenException('Verify your email before signing in.');
      }

      const session = await this.createAuthenticatedSession(user.id, user.email);

      this.auditLogService.record({
        action: 'auth.login',
        email: user.email,
        outcome: 'success',
        userId: user.id,
      });

      return session;
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.login',
        email: normalizedEmail,
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
      });
      throw error;
    }
  }

  async refresh(refreshToken: string) {
    try {
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

      this.auditLogService.record({
        action: 'auth.refresh',
        email: user.email,
        outcome: 'success',
        userId: user.id,
      });

      return {
        user: this.usersRepository.toProfile(user),
        tokens,
      };
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.refresh',
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
      });
      throw error;
    }
  }

  async logout(userId: string) {
    try {
      await this.usersRepository.updateRefreshToken(userId, undefined);

      this.auditLogService.record({
        action: 'auth.logout',
        outcome: 'success',
        userId,
      });

      return { success: true };
    } catch (error) {
      this.auditLogService.record({
        action: 'auth.logout',
        metadata: this.getAuditFailureMetadata(error),
        outcome: 'failure',
        userId,
      });
      throw error;
    }
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

  private getAuditFailureMetadata(error: unknown) {
    if (error instanceof HttpException) {
      return {
        statusCode: error.getStatus(),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }
}
