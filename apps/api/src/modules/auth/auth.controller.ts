import { Body, Controller, Inject, Post, UseGuards, UsePipes } from '@nestjs/common';
import {
  changePasswordWithOtpSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  requestPasswordChangeOtpSchema,
  requestPasswordResetSchema,
  resendVerificationCodeSchema,
  resetPasswordWithCodeSchema,
  verifyEmailSchema,
  verifyPasswordResetCodeSchema,
} from '@spendwise/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';
import { AuthService } from './auth.service';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  register(@Body() body: { name: string; email: string; phone: string; password: string }) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  verifyEmail(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body);
  }

  @Post('resend-verification-code')
  @UsePipes(new ZodValidationPipe(resendVerificationCodeSchema))
  resendVerificationCode(@Body() body: { email: string }) {
    return this.authService.resendVerificationCode(body);
  }

  @Post('request-password-reset')
  @UsePipes(new ZodValidationPipe(requestPasswordResetSchema))
  requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body);
  }

  @Post('verify-password-reset-code')
  @UsePipes(new ZodValidationPipe(verifyPasswordResetCodeSchema))
  verifyPasswordResetCode(@Body() body: { email: string; code: string }) {
    return this.authService.verifyPasswordResetCode(body);
  }

  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(resetPasswordWithCodeSchema))
  resetPassword(@Body() body: { email: string; code: string; password: string }) {
    return this.authService.resetPassword(body);
  }

  @Post('request-password-change-otp')
  @UseGuards(JwtAuthGuard)
  requestPasswordChangeOtp(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(requestPasswordChangeOtpSchema)) body: { currentPassword: string },
  ) {
    return this.authService.requestPasswordChangeOtp(user.userId, body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(changePasswordWithOtpSchema))
    body: { currentPassword: string; code: string; password: string },
  ) {
    return this.authService.changePassword(user.userId, body);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('refresh')
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.userId);
  }
}
