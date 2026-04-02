import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { Budget } from '@spendwise/shared';

import { BudgetModel, type BudgetDocument } from './budget.schema';

@Injectable()
export class BudgetsRepository {
  constructor(
    @InjectModel(BudgetModel.name)
    private readonly budgetModel: Model<BudgetModel>,
  ) {}

  upsert(input: {
    userId: string;
    categoryId: string;
    limitAmount: number;
    month: number;
    year: number;
  }) {
    return this.budgetModel
      .findOneAndUpdate(
        {
          userId: input.userId,
          categoryId: input.categoryId,
          month: input.month,
          year: input.year
        },
        input,
        {
          upsert: true,
          new: true
        },
      )
      .exec();
  }

  findByMonth(userId: string, month: number, year: number) {
    return this.budgetModel.find({ userId, month, year }).sort({ categoryId: 1 }).exec();
  }

  toDomain(document: BudgetDocument): Budget {
    return {
      id: document.id,
      userId: document.userId,
      categoryId: document.categoryId,
      limitAmount: document.limitAmount,
      month: document.month,
      year: document.year,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    };
  }
}
