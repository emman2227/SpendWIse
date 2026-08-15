import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/types/auth-user.interface';
import { AnalyticsService } from './analytics.service';

@Controller({
  path: 'analytics',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.analyticsService.getDashboard(user.userId);
  }

  @Post('generate')
  generate(@CurrentUser() user: AuthUser) {
    return this.analyticsService.generate(user.userId);
  }

  @Get('forecast')
  getForecast(@CurrentUser() user: AuthUser) {
    return this.analyticsService.getForecastDetails(user.userId);
  }

  @Get('insights')
  getInsights(@CurrentUser() user: AuthUser) {
    return this.analyticsService.getDashboard(user.userId).then((res) => res.insights);
  }

  @Get('insights/:id')
  getInsightDetails(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.analyticsService.getInsightDetails(user.userId, id);
  }

  @Post('insights/:id/deep-dive')
  deepDiveInsight(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('question') question: string,
  ) {
    return this.analyticsService.deepDiveInsight(user.userId, id, question);
  }

  @Get('budgets/recommend')
  recommendBudgets(@CurrentUser() user: AuthUser) {
    return this.analyticsService.recommendBudgets(user.userId);
  }
}
