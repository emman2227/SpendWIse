import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { createExpenseSchema, expenseQuerySchema, updateExpenseSchema } from '@spendwise/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';
import { ExpensesService } from './expenses.service';

@Controller({
  path: 'expenses',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(@Inject(ExpensesService) private readonly expensesService: ExpensesService) {}

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="expenses.csv"')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async exportCsv(@CurrentUser() user: AuthUser, @Res() res: any) {
    const csv = await this.expensesService.exportToCsv(user.userId);
    res.send(csv);
  }

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

  // Recurring Expenses endpoints
  @Post('recurring')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createRecurring(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.expensesService.createRecurring(user.userId, body);
  }

  @Get('recurring')
  listRecurring(@CurrentUser() user: AuthUser) {
    return this.expensesService.listRecurring(user.userId);
  }

  @Patch('recurring/:id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateRecurring(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    return this.expensesService.updateRecurring(user.userId, id, body);
  }

  @Delete('recurring/:id')
  deleteRecurring(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.deleteRecurring(user.userId, id);
  }
}
