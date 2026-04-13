import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Category } from '@spendwise/shared';
import type { Model } from 'mongoose';

import { type CategoryDocument, CategoryModel } from './category.schema';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectModel(CategoryModel.name)
    private readonly categoryModel: Model<CategoryModel>,
  ) {}

  findForUser(userId: string) {
    return this.categoryModel
      .find({
        $or: [{ userId }, { isSystemDefined: true }],
      })
      .sort({ isSystemDefined: -1, name: 1 })
      .exec();
  }

  create(input: { userId: string; name: string; icon: string; color: string }) {
    return this.categoryModel.create({
      ...input,
      isSystemDefined: false,
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.categoryModel
      .findOne({ _id: id, $or: [{ userId }, { isSystemDefined: true }] })
      .exec();
  }

  findByNameForUser(userId: string, name: string) {
    return this.categoryModel
      .findOne({
        name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
        $or: [{ userId }, { isSystemDefined: true }],
      })
      .exec();
  }

  async update(
    id: string,
    userId: string,
    input: Partial<{ name: string; icon: string; color: string }>,
  ) {
    const category = await this.categoryModel
      .findOneAndUpdate({ _id: id, userId, isSystemDefined: false }, input, { new: true })
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async delete(id: string, userId: string) {
    const category = await this.categoryModel
      .findOneAndDelete({ _id: id, userId, isSystemDefined: false })
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
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
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
