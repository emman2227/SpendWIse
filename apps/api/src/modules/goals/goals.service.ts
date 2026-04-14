import { Inject, Injectable } from '@nestjs/common';

import { GoalsRepository } from './goals.repository';

@Injectable()
export class GoalsService {
  constructor(@Inject(GoalsRepository) private readonly goalsRepository: GoalsRepository) {}

  async list(userId: string) {
    const goals = await this.goalsRepository.findByUser(userId);
    return goals.map((goal) => this.goalsRepository.toDomain(goal));
  }

  async create(
    userId: string,
    input: {
      title: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
      notes?: string;
    },
  ) {
    const goal = await this.goalsRepository.create({
      userId,
      ...input,
    });

    return this.goalsRepository.toDomain(goal);
  }

  async update(
    userId: string,
    goalId: string,
    input: Partial<{
      title: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
      notes?: string;
    }>,
  ) {
    const goal = await this.goalsRepository.update(goalId, userId, input);
    return this.goalsRepository.toDomain(goal);
  }

  async delete(userId: string, goalId: string) {
    const goal = await this.goalsRepository.delete(goalId, userId);
    return this.goalsRepository.toDomain(goal);
  }
}
