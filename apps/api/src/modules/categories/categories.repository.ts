import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { Category } from '@spendwise/shared';

import { CategoryModel, type CategoryDocument } from './category.schema';

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectModel(CategoryModel.name)
    private readonly categoryModel: Model<CategoryModel>,
  ) {}

  findForUser(userId: string) {
    return this.categoryModel
      .find({
        $or: [{ userId }, { isSystemDefined: true }]
      })
      .sort({ isSystemDefined: -1, name: 1 })
      .exec();
  }

  create(input: { userId: string; name: string; icon: string; color: string }) {
    return this.categoryModel.create({
      ...input,
      isSystemDefined: false
    });
  }

  toDomain(document: CategoryDocument): Category {
    return {
      id: document.id,
      userId: document.userId,
      isSystemDefined: document.isSystemDefined,
      name: document.name,
      icon: document.icon,
      color: document.color,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    };
  }
}
