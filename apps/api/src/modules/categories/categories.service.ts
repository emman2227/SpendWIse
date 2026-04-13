import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type { BudgetsRepository } from '../budgets/budgets.repository';
import type { ExpensesRepository } from '../expenses/expenses.repository';
import type { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly expensesRepository: ExpensesRepository,
    private readonly budgetsRepository: BudgetsRepository,
  ) {}

  async list(userId: string) {
    const categories = await this.categoriesRepository.findForUser(userId);
    return categories.map((category) => this.categoriesRepository.toDomain(category));
  }

  async create(userId: string, input: { name: string; icon: string; color: string }) {
    await this.ensureCategoryNameAvailable(userId, input.name);

    const category = await this.categoriesRepository.create({
      userId,
      ...input,
    });

    return this.categoriesRepository.toDomain(category);
  }

  async update(
    userId: string,
    categoryId: string,
    input: Partial<{ name: string; icon: string; color: string }>,
  ) {
    const existingCategory = await this.categoriesRepository.findByIdForUser(categoryId, userId);

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    if (existingCategory.isSystemDefined || existingCategory.userId !== userId) {
      throw new BadRequestException('Default categories cannot be edited.');
    }

    if (input.name && input.name.toLowerCase() !== existingCategory.name.toLowerCase()) {
      await this.ensureCategoryNameAvailable(userId, input.name, categoryId);
    }

    const category = await this.categoriesRepository.update(categoryId, userId, input);
    return this.categoriesRepository.toDomain(category);
  }

  async delete(userId: string, categoryId: string) {
    const existingCategory = await this.categoriesRepository.findByIdForUser(categoryId, userId);

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    if (existingCategory.isSystemDefined || existingCategory.userId !== userId) {
      throw new BadRequestException('Default categories cannot be deleted.');
    }

    const [linkedExpenseCount, linkedBudgetCount] = await Promise.all([
      this.expensesRepository.countByCategoryId(userId, categoryId),
      this.budgetsRepository.countByCategoryId(userId, categoryId),
    ]);

    if (linkedExpenseCount > 0 || linkedBudgetCount > 0) {
      throw new BadRequestException(
        'This category is still linked to expenses or budgets. Reassign those records before deleting it.',
      );
    }

    const category = await this.categoriesRepository.delete(categoryId, userId);
    return this.categoriesRepository.toDomain(category);
  }

  private async ensureCategoryNameAvailable(
    userId: string,
    name: string,
    currentCategoryId?: string,
  ) {
    const existingCategory = await this.categoriesRepository.findByNameForUser(userId, name);

    if (existingCategory && existingCategory.id !== currentCategoryId) {
      throw new BadRequestException('A category with this name already exists.');
    }
  }
}
