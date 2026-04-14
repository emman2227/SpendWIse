import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { createBudgetSchema } from '@spendwise/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';
import { BudgetsService, budgetSummaryQuerySchema } from './budgets.service';

@Controller({
  path: 'budgets',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(@Inject(BudgetsService) private readonly budgetsService: BudgetsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createBudgetSchema))
  upsert(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      categoryId: string;
      limitAmount: number;
      month: number;
      year: number;
    },
  ) {
    return this.budgetsService.upsert(user.userId, body);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(budgetSummaryQuerySchema))
  list(@CurrentUser() user: AuthUser, @Query() query: { month: number; year: number }) {
    return this.budgetsService.list(user.userId, query.month, query.year);
  }

  @Get('summary')
  @UsePipes(new ZodValidationPipe(budgetSummaryQuerySchema))
  summary(@CurrentUser() user: AuthUser, @Query() query: { month: number; year: number }) {
    return this.budgetsService.getSummary(user.userId, query.month, query.year);
  }

  @Delete(':budgetId')
  remove(@CurrentUser() user: AuthUser, @Param('budgetId') budgetId: string) {
    return this.budgetsService.delete(user.userId, budgetId);
  }
}
