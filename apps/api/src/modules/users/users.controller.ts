import { Body, Controller, Get, Patch, UseGuards, UsePipes } from '@nestjs/common';
import { updateNotificationPreferencesSchema, updateProfileSchema } from '@spendwise/shared';
import type { z } from 'zod';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';
import type { UsersService } from './users.service';

@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  updateProfile(@CurrentUser() user: AuthUser, @Body() body: z.infer<typeof updateProfileSchema>) {
    return this.usersService.updateProfile(user.userId, body);
  }

  @Get('me/notification-preferences')
  @UseGuards(JwtAuthGuard)
  getNotificationPreferences(@CurrentUser() user: AuthUser) {
    return this.usersService.getNotificationPreferences(user.userId);
  }

  @Patch('me/notification-preferences')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(updateNotificationPreferencesSchema))
  updateNotificationPreferences(
    @CurrentUser() user: AuthUser,
    @Body() body: z.infer<typeof updateNotificationPreferencesSchema>,
  ) {
    return this.usersService.updateNotificationPreferences(user.userId, body);
  }
}
