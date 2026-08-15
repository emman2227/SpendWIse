import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Model } from 'mongoose';

import type { ExpensesRepository } from './expenses.repository';
import { RecurringExpenseModel } from './recurring-expense.schema';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private readonly expensesRepository: ExpensesRepository,
    @InjectModel(RecurringExpenseModel.name)
    private readonly recurringExpenseModel: Model<RecurringExpenseModel>,
  ) {}

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
      ...input,
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

  async exportToCsv(userId: string): Promise<string> {
    const expenses = await this.list(userId, {});
    if (expenses.length === 0) {
      return 'Date,Description,Amount,Category ID,Payment Method,Notes\n';
    }

    const header = ['Date', 'Description', 'Amount', 'Category ID', 'Payment Method', 'Notes'].join(
      ',',
    );

    const rows = expenses.map((e) => {
      const date = new Date(e.date).toISOString().split('T')[0];
      const desc = e.description.replace(/"/g, '""');
      const amount = e.amount;
      const cat = e.categoryId;
      const method = e.paymentMethod;
      const notes = (e.notes || '').replace(/"/g, '""');

      return `${date},"${desc}",${amount},${cat},${method},"${notes}"`;
    });

    return [header, ...rows].join('\n');
  }

  // Recurring Expenses CRUD
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createRecurring(userId: string, input: any) {
    return this.recurringExpenseModel.create({ ...input, userId });
  }

  async listRecurring(userId: string) {
    return this.recurringExpenseModel.find({ userId }).exec();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateRecurring(userId: string, id: string, input: any) {
    return this.recurringExpenseModel
      .findOneAndUpdate({ _id: id, userId }, input, { new: true })
      .exec();
  }

  async deleteRecurring(userId: string, id: string) {
    return this.recurringExpenseModel.findOneAndDelete({ _id: id, userId }).exec();
  }

  // Cron Job to process recurring expenses
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringExpenses() {
    this.logger.log('Processing recurring expenses...');
    const now = new Date();
    const dueExpenses = await this.recurringExpenseModel
      .find({
        isActive: true,
        nextDueDate: { $lte: now },
      })
      .exec();

    let processed = 0;
    for (const exp of dueExpenses) {
      try {
        await this.expensesRepository.create({
          userId: exp.userId,
          amount: exp.amount,
          categoryId: exp.categoryId,
          description: exp.description,
          paymentMethod: 'bank_transfer', // Defaulting since recurring doesn't store this yet
          date: new Date().toISOString(),
          notes: 'Auto-generated recurring expense',
        });

        // Calculate next due date
        const nextDate = new Date(exp.nextDueDate);
        if (exp.cadence === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (exp.cadence === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          // Default monthly
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        exp.nextDueDate = nextDate;
        await exp.save();
        processed++;
      } catch (e) {
        this.logger.error(`Failed to process recurring expense ${exp.id}`, e);
      }
    }

    if (processed > 0) {
      this.logger.log(`Generated ${processed} recurring expenses.`);
    }
  }
}
