import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Goal } from '@spendwise/shared';
import type { Model } from 'mongoose';

import { type GoalDocument, GoalModel } from './goal.schema';

@Injectable()
export class GoalsRepository {
  constructor(
    @InjectModel(GoalModel.name)
    private readonly goalModel: Model<GoalModel>,
  ) {}

  create(input: {
    userId: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    notes?: string;
  }) {
    return this.goalModel.create({
      ...input,
      targetDate: new Date(input.targetDate),
    });
  }

  findByUser(userId: string) {
    return this.goalModel.find({ userId }).sort({ targetDate: 1, createdAt: -1 }).exec();
  }

  async update(
    id: string,
    userId: string,
    input: Partial<{
      title: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
      notes?: string;
    }>,
  ) {
    const goal = await this.goalModel
      .findOneAndUpdate(
        { _id: id, userId },
        {
          ...input,
          ...(input.targetDate ? { targetDate: new Date(input.targetDate) } : {}),
        },
        { new: true },
      )
      .exec();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async delete(id: string, userId: string) {
    const goal = await this.goalModel.findOneAndDelete({ _id: id, userId }).exec();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  toDomain(document: GoalDocument): Goal {
    return {
      id: document.id,
      userId: document.userId,
      title: document.title,
      targetAmount: document.targetAmount,
      currentAmount: document.currentAmount,
      targetDate: document.targetDate.toISOString(),
      notes: document.notes,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
