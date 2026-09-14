import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  clearUserDataSchema,
  deleteAccountSchema,
  updateNotificationPreferencesSchema,
  updateProfileSchema,
} from '@spendwise/shared';
import type { z } from 'zod';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';
import { UsersService } from './users.service';

@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

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

  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  exportUserData(@CurrentUser() user: AuthUser) {
    return this.usersService.exportData(user.userId);
  }

  @Post('me/clear-data')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(clearUserDataSchema))
  clearUserData(@CurrentUser() user: AuthUser, @Body() body: z.infer<typeof clearUserDataSchema>) {
    return this.usersService.clearData(user.userId, body.password);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(deleteAccountSchema))
  deleteAccount(@CurrentUser() user: AuthUser, @Body() body: z.infer<typeof deleteAccountSchema>) {
    return this.usersService.deleteAccount(user.userId, body.password);
  }

  @Post('me/delete')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(deleteAccountSchema))
  deleteAccountPost(
    @CurrentUser() user: AuthUser,
    @Body() body: z.infer<typeof deleteAccountSchema>,
  ) {
    return this.usersService.deleteAccount(user.userId, body.password);
  }
}
