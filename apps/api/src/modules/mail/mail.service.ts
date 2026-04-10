import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { VerificationDeliveryMethod } from '@spendwise/shared';
import nodemailer, { type Transporter } from 'nodemailer';

interface SendVerificationCodeInput {
  code: string;
  expiresInMinutes: number;
  name: string;
  to: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  async sendVerificationCode(
    input: SendVerificationCodeInput,
  ): Promise<VerificationDeliveryMethod> {
    if (!this.hasConfiguredMailAuth()) {
      return this.logCodeFallback({
        code: input.code,
        label: 'Verification code',
        reason: 'Mail credentials are not configured.',
        to: input.to,
      });
    }

    return this.sendCodeEmailWithFallback({
      to: input.to,
      subject: 'Your SpendWise verification code',
      logLabel: 'Verification code',
      text: [
        `Hi ${input.name},`,
        '',
        `Your SpendWise verification code is ${input.code}.`,
        `It expires in ${input.expiresInMinutes} minutes.`,
        '',
        'If you did not create this account, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
          <p>Hi ${this.escapeHtml(input.name)},</p>
          <p>Your SpendWise verification code is:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.35em; margin: 16px 0;">
            ${this.escapeHtml(input.code)}
          </p>
          <p>It expires in ${input.expiresInMinutes} minutes.</p>
          <p>If you did not create this account, you can ignore this email.</p>
        </div>
      `,
      code: input.code,
    });
  }

  async sendPasswordResetCode(
    input: SendVerificationCodeInput,
  ): Promise<VerificationDeliveryMethod> {
    if (!this.hasConfiguredMailAuth()) {
      return this.logCodeFallback({
        code: input.code,
        label: 'Password reset code',
        reason: 'Mail credentials are not configured.',
        to: input.to,
      });
    }

    return this.sendCodeEmailWithFallback({
      to: input.to,
      subject: 'Your SpendWise password reset code',
      logLabel: 'Password reset code',
      text: [
        `Hi ${input.name},`,
        '',
        `Your SpendWise password reset code is ${input.code}.`,
        `It expires in ${input.expiresInMinutes} minutes.`,
        '',
        'If you did not request a password reset, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
          <p>Hi ${this.escapeHtml(input.name)},</p>
          <p>Your SpendWise password reset code is:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.35em; margin: 16px 0;">
            ${this.escapeHtml(input.code)}
          </p>
          <p>It expires in ${input.expiresInMinutes} minutes.</p>
          <p>If you did not request a password reset, you can ignore this email.</p>
        </div>
      `,
      code: input.code,
    });
  }

  async sendPasswordChangeCode(
    input: SendVerificationCodeInput,
  ): Promise<VerificationDeliveryMethod> {
    if (!this.hasConfiguredMailAuth()) {
      return this.logCodeFallback({
        code: input.code,
        label: 'Password change code',
        reason: 'Mail credentials are not configured.',
        to: input.to,
      });
    }

    return this.sendCodeEmailWithFallback({
      to: input.to,
      subject: 'Your SpendWise password change code',
      logLabel: 'Password change code',
      text: [
        `Hi ${input.name},`,
        '',
        `Your SpendWise password change code is ${input.code}.`,
        `It expires in ${input.expiresInMinutes} minutes.`,
        '',
        'If you did not request this change, keep your current password and review your account security.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
          <p>Hi ${this.escapeHtml(input.name)},</p>
          <p>Your SpendWise password change code is:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.35em; margin: 16px 0;">
            ${this.escapeHtml(input.code)}
          </p>
          <p>It expires in ${input.expiresInMinutes} minutes.</p>
          <p>If you did not request this change, keep your current password and review your account security.</p>
        </div>
      `,
      code: input.code,
    });
  }

  private getTransporter() {
    if (!this.transporter) {
      const smtpUser = this.configService.getOrThrow<string>('SMTP_USER').trim();

      this.transporter = nodemailer.createTransport({
        host: this.configService.getOrThrow<string>('SMTP_HOST'),
        port: this.configService.getOrThrow<number>('SMTP_PORT'),
        secure: this.configService.getOrThrow<boolean>('SMTP_SECURE'),
        auth: this.getMailAuth(smtpUser),
      });
    }

    return this.transporter;
  }

  private async sendCodeEmail(input: {
    code: string;
    html: string;
    logLabel: string;
    subject: string;
    text: string;
    to: string;
  }) {
    const transporter = this.getTransporter();
    const smtpUser = this.configService.getOrThrow<string>('SMTP_USER');
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL')?.trim() || smtpUser;
    const fromName = this.configService.getOrThrow<string>('SMTP_FROM_NAME');

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }

  private async sendCodeEmailWithFallback(input: {
    code: string;
    html: string;
    logLabel: string;
    subject: string;
    text: string;
    to: string;
  }): Promise<VerificationDeliveryMethod> {
    try {
      await this.sendCodeEmail(input);
      return 'smtp';
    } catch (error) {
      if (!this.shouldFallbackToLog()) {
        throw error;
      }

      this.logger.error(
        `SMTP delivery failed for ${input.to}. Falling back to API terminal logging.`,
        error instanceof Error ? error.stack : undefined,
      );

      return this.logCodeFallback({
        code: input.code,
        label: input.logLabel,
        reason: 'SMTP delivery failed.',
        to: input.to,
      });
    }
  }

  private logCodeFallback(input: { code: string; label: string; reason: string; to: string }) {
    this.logger.warn(`${input.reason} ${input.label} for ${input.to}: ${input.code}`);
    return 'log' as const;
  }

  private hasConfiguredMailAuth() {
    const smtpUser = this.configService.get<string>('SMTP_USER')?.trim();

    if (!smtpUser) {
      return false;
    }

    return (
      this.hasGoogleOAuthCredentials() ||
      Boolean(this.configService.get<string>('SMTP_PASS')?.trim())
    );
  }

  private hasGoogleOAuthCredentials() {
    return Boolean(
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID')?.trim() &&
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET')?.trim() &&
      this.configService.get<string>('GOOGLE_OAUTH_REFRESH_TOKEN')?.trim(),
    );
  }

  private getMailAuth(smtpUser: string) {
    if (this.hasGoogleOAuthCredentials()) {
      return {
        type: 'OAuth2' as const,
        user: smtpUser,
        clientId: this.configService.getOrThrow<string>('GOOGLE_OAUTH_CLIENT_ID').trim(),
        clientSecret: this.configService.getOrThrow<string>('GOOGLE_OAUTH_CLIENT_SECRET').trim(),
        refreshToken: this.configService.getOrThrow<string>('GOOGLE_OAUTH_REFRESH_TOKEN').trim(),
      };
    }

    return {
      user: smtpUser,
      pass: this.configService.getOrThrow<string>('SMTP_PASS').trim(),
    };
  }

  private shouldFallbackToLog() {
    return this.configService.get<string>('NODE_ENV') !== 'production';
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
