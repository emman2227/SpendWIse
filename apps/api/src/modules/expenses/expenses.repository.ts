import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { Expense } from '@spendwise/shared';

import { ExpenseModel, type ExpenseDocument } from './expense.schema';

@Injectable()
export class ExpensesRepository {
  constructor(
    @InjectModel(ExpenseModel.name)
    private readonly expenseModel: Model<ExpenseModel>,
  ) {}

  create(input: {
    userId: string;
    amount: number;
    categoryId: string;
    description: string;
    paymentMethod: string;
    date: string;
    notes?: string;
  }) {
    return this.expenseModel.create({
      ...input,
      date: new Date(input.date)
    });
  }

  async update(
    id: string,
    userId: string,
    input: Partial<{
      amount: number;
      categoryId: string;
      description: string;
      paymentMethod: string;
      date: string;
      notes?: string;
    }>,
  ) {
    const expense = await this.expenseModel
      .findOneAndUpdate(
        { _id: id, userId },
        {
          ...input,
          ...(input.date ? { date: new Date(input.date) } : {})
        },
        { new: true },
      )
      .exec();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async delete(id: string, userId: string) {
    const expense = await this.expenseModel.findOneAndDelete({ _id: id, userId }).exec();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  findByUser(
    userId: string,
    filters: { categoryId?: string; month?: number; year?: number } = {},
  ) {
    const query: Record<string, unknown> = { userId };

    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }

    if (filters.month && filters.year) {
      const start = new Date(Date.UTC(filters.year, filters.month - 1, 1));
      const end = new Date(Date.UTC(filters.year, filters.month, 1));
      query.date = { $gte: start, $lt: end };
    }

    return this.expenseModel.find(query).sort({ date: -1 }).exec();
  }

  async sumByCategoryForMonth(userId: string, month: number, year: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const result = await this.expenseModel.aggregate<{
      _id: string;
      total: number;
    }>([
      {
        $match: {
          userId,
          date: {
            $gte: start,
            $lt: end
          }
        }
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' }
        }
      }
    ]);

    return new Map(result.map((entry) => [entry._id, entry.total]));
  }

  toDomain(document: ExpenseDocument): Expense {
    return {
      id: document.id,
      userId: document.userId,
      amount: document.amount,
      categoryId: document.categoryId,
      description: document.description,
      paymentMethod: document.paymentMethod as Expense['paymentMethod'],
      date: document.date.toISOString(),
      notes: document.notes,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    };
  }
}
