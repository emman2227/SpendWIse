import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationCodeSchema,
  verifyEmailSchema,
} from '@spendwise/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';
import type { AuthService } from './auth.service';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  register(@Body() body: { name: string; email: string; password: string }) {
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
