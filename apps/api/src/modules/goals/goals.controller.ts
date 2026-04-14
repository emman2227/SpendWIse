import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { createGoalSchema, updateGoalSchema } from '@spendwise/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';
import { GoalsService } from './goals.service';

@Controller({
  path: 'goals',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(@Inject(GoalsService) private readonly goalsService: GoalsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.goalsService.list(user.userId);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createGoalSchema))
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      title: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
      notes?: string;
    },
  ) {
    return this.goalsService.create(user.userId, body);
  }

  @Patch(':goalId')
  @UsePipes(new ZodValidationPipe(updateGoalSchema))
  update(
    @CurrentUser() user: AuthUser,
    @Param('goalId') goalId: string,
    @Body()
    body: Partial<{
      title: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
      notes?: string;
    }>,
  ) {
    return this.goalsService.update(user.userId, goalId, body);
  }

  @Delete(':goalId')
  remove(@CurrentUser() user: AuthUser, @Param('goalId') goalId: string) {
    return this.goalsService.delete(user.userId, goalId);
  }
}
