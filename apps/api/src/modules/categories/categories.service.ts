import { Injectable } from '@nestjs/common';

import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async list(userId: string) {
    const categories = await this.categoriesRepository.findForUser(userId);
    return categories.map((category) => this.categoriesRepository.toDomain(category));
  }

  async create(
    userId: string,
    input: { name: string; icon: string; color: string },
  ) {
    const category = await this.categoriesRepository.create({
      userId,
      ...input
    });

    return this.categoriesRepository.toDomain(category);
  }
}
