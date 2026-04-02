import { Injectable } from '@nestjs/common';

import { ExpensesRepository } from './expenses.repository';

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  async create(
    userId: string,
    input: {
      amount: number;
      categoryId: string;
      description: string;
      paymentMethod: string;
      date: string;
      notes?: string;
    },
  ) {
    const expense = await this.expensesRepository.create({
      userId,
      ...input
    });

    return this.expensesRepository.toDomain(expense);
  }

  async update(
    userId: string,
    expenseId: string,
    input: Partial<{
      amount: number;
      categoryId: string;
      description: string;
      paymentMethod: string;
      date: string;
      notes?: string;
    }>,
  ) {
    const expense = await this.expensesRepository.update(expenseId, userId, input);
    return this.expensesRepository.toDomain(expense);
  }

  async delete(userId: string, expenseId: string) {
    const expense = await this.expensesRepository.delete(expenseId, userId);
    return this.expensesRepository.toDomain(expense);
  }

  async list(userId: string, filters: { categoryId?: string; month?: number; year?: number }) {
    const expenses = await this.expensesRepository.findByUser(userId, filters);
    return expenses.map((expense) => this.expensesRepository.toDomain(expense));
  }

  getMonthlyCategoryTotals(userId: string, month: number, year: number) {
    return this.expensesRepository.sumByCategoryForMonth(userId, month, year);
  }
}
