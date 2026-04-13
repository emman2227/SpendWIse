import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { z } from 'zod';

import type { ExpensesService } from '../expenses/expenses.service';
import type { BudgetsRepository } from './budgets.repository';

export const budgetSummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(3000),
});

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly expensesService: ExpensesService,
  ) {}

  async upsert(
    userId: string,
    input: {
      categoryId: string;
      limitAmount: number;
      month: number;
      year: number;
    },
  ) {
    const budget = await this.budgetsRepository.upsert({
      userId,
      ...input,
    });

    if (!budget) {
      throw new InternalServerErrorException('Budget could not be saved');
    }

    return this.budgetsRepository.toDomain(budget);
  }

  async list(userId: string, month: number, year: number) {
    const budgets = await this.budgetsRepository.findByMonth(userId, month, year);
    return budgets.map((budget) => this.budgetsRepository.toDomain(budget));
  }

  async delete(userId: string, budgetId: string) {
    const budget = await this.budgetsRepository.delete(budgetId, userId);
    return this.budgetsRepository.toDomain(budget);
  }

  async getSummary(userId: string, month: number, year: number) {
    const [budgets, spendByCategory] = await Promise.all([
      this.list(userId, month, year),
      this.expensesService.getMonthlyCategoryTotals(userId, month, year),
    ]);

    return {
      month,
      year,
      items: budgets.map((budget) => {
        const spent = spendByCategory.get(budget.categoryId) ?? 0;
        return {
          ...budget,
          spent,
          remaining: budget.limitAmount - spent,
          isOverBudget: spent > budget.limitAmount,
        };
      }),
    };
  }
}
