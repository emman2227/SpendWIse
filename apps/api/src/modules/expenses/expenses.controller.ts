import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes
} from '@nestjs/common';

import {
  createExpenseSchema,
  expenseQuerySchema,
  updateExpenseSchema
} from '@spendwise/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';

import { ExpensesService } from './expenses.service';

@Controller({
  path: 'expenses',
  version: '1'
})
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(expenseQuerySchema))
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: { categoryId?: string; month?: number; year?: number },
  ) {
    return this.expensesService.list(user.userId, query);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createExpenseSchema))
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      amount: number;
      categoryId: string;
      description: string;
      paymentMethod: string;
      date: string;
      notes?: string;
    },
  ) {
    return this.expensesService.create(user.userId, body);
  }

  @Patch(':expenseId')
  @UsePipes(new ZodValidationPipe(updateExpenseSchema))
  update(
    @CurrentUser() user: AuthUser,
    @Param('expenseId') expenseId: string,
    @Body()
    body: Partial<{
      amount: number;
      categoryId: string;
      description: string;
      paymentMethod: string;
      date: string;
      notes?: string;
    }>,
  ) {
    return this.expensesService.update(user.userId, expenseId, body);
  }

  @Delete(':expenseId')
  remove(@CurrentUser() user: AuthUser, @Param('expenseId') expenseId: string) {
    return this.expensesService.delete(user.userId, expenseId);
  }
}
