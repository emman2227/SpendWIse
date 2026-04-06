import { Injectable, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
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

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(
    input: SendVerificationCodeInput,
  ): Promise<VerificationDeliveryMethod> {
    const smtpUser = this.configService.get<string>('SMTP_USER')?.trim();
    const smtpPass = this.configService.get<string>('SMTP_PASS')?.trim();

    if (!smtpUser || !smtpPass) {
      this.logger.warn(
        `SMTP credentials are not configured. Verification code for ${input.to}: ${input.code}`,
      );

      return 'log';
    }

    const transporter = this.getTransporter();
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL')?.trim() || smtpUser;
    const fromName = this.configService.getOrThrow<string>('SMTP_FROM_NAME');

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: input.to,
      subject: 'Your SpendWise verification code',
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
    });

    return 'smtp';
  }

  private getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.getOrThrow<string>('SMTP_HOST'),
        port: this.configService.getOrThrow<number>('SMTP_PORT'),
        secure: this.configService.getOrThrow<boolean>('SMTP_SECURE'),
        auth: {
          user: this.configService.getOrThrow<string>('SMTP_USER'),
          pass: this.configService.getOrThrow<string>('SMTP_PASS'),
        },
      });
    }

    return this.transporter;
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
