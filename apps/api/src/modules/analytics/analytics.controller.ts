import { Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/types/auth-user.interface';

import { AnalyticsService } from './analytics.service';

@Controller({
  path: 'analytics',
  version: '1'
})
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.analyticsService.getDashboard(user.userId);
  }

  @Post('generate')
  generate(@CurrentUser() user: AuthUser) {
    return this.analyticsService.generate(user.userId);
  }
}
