import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
  type UserProfile,
} from '@spendwise/shared';
import type { Model } from 'mongoose';

import { BudgetModel } from '../budgets/budget.schema';
import { CategoryModel } from '../categories/category.schema';
import { ExpenseModel } from '../expenses/expense.schema';
import { GoalModel } from '../goals/goal.schema';
import { type UserDocument, UserModel } from './user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(UserModel.name) private readonly userModel: Model<UserModel>,
    @InjectModel(ExpenseModel.name) private readonly expenseModel: Model<ExpenseModel>,
    @InjectModel(BudgetModel.name) private readonly budgetModel: Model<BudgetModel>,
    @InjectModel(GoalModel.name) private readonly goalModel: Model<GoalModel>,
    @InjectModel(CategoryModel.name) private readonly categoryModel: Model<CategoryModel>,
  ) {}

  create(input: { name: string; email: string; phone: string; passwordHash: string }) {
    return this.userModel.create(input);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  updatePendingRegistration(
    userId: string,
    input: { name: string; phone: string; passwordHash: string },
  ) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          name: input.name,
          phone: input.phone,
          passwordHash: input.passwordHash,
          emailVerified: false,
          $unset: {
            refreshTokenHash: 1,
            emailVerifiedAt: 1,
          },
        },
        { new: true },
      )
      .exec();
  }

  updateEmailVerification(
    userId: string,
    input: { codeHash: string; expiresAt: Date; sentAt: Date },
  ) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          emailVerificationCodeHash: input.codeHash,
          emailVerificationCodeExpiresAt: input.expiresAt,
          emailVerificationSentAt: input.sentAt,
        },
        { new: true },
      )
      .exec();
  }

  updatePasswordReset(userId: string, input: { codeHash: string; expiresAt: Date; sentAt: Date }) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          passwordResetCodeHash: input.codeHash,
          passwordResetCodeExpiresAt: input.expiresAt,
          passwordResetSentAt: input.sentAt,
        },
        { new: true },
      )
      .exec();
  }

  updatePasswordChange(userId: string, input: { codeHash: string; expiresAt: Date; sentAt: Date }) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          passwordChangeCodeHash: input.codeHash,
          passwordChangeCodeExpiresAt: input.expiresAt,
          passwordChangeSentAt: input.sentAt,
        },
        { new: true },
      )
      .exec();
  }

  markEmailVerified(userId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          $unset: {
            emailVerificationCodeHash: 1,
            emailVerificationCodeExpiresAt: 1,
            emailVerificationSentAt: 1,
          },
        },
        { new: true },
      )
      .exec();
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          passwordHash,
          $unset: {
            refreshTokenHash: 1,
            passwordResetCodeHash: 1,
            passwordResetCodeExpiresAt: 1,
            passwordResetSentAt: 1,
            passwordChangeCodeHash: 1,
            passwordChangeCodeExpiresAt: 1,
            passwordChangeSentAt: 1,
          },
        },
        { new: true },
      )
      .exec();
  }

  updateRefreshToken(userId: string, refreshTokenHash?: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        refreshTokenHash ? { refreshTokenHash } : { $unset: { refreshTokenHash: 1 } },
        { new: true },
      )
      .exec();
  }

  updateProfile(userId: string, input: { name?: string; phone?: string; currency?: string }) {
    const updates: Record<string, string> = {};

    if (input.name !== undefined) {
      updates.name = input.name;
    }

    if (input.phone !== undefined) {
      updates.phone = input.phone;
    }

    if (input.currency !== undefined) {
      updates.currency = input.currency;
    }

    return this.userModel.findByIdAndUpdate(userId, updates, { new: true }).exec();
  }

  getNotificationPreferences(document: UserDocument): NotificationPreferences {
    const stored = document.notificationPreferences ?? {};

    return Object.fromEntries(
      Object.entries(defaultNotificationPreferences).map(([key, defaultValue]) => [
        key,
        typeof stored[key] === 'boolean' ? stored[key] : defaultValue,
      ]),
    ) as NotificationPreferences;
  }

  updateNotificationPreferences(userId: string, input: Partial<NotificationPreferences>) {
    const updates: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'boolean') {
        updates[`notificationPreferences.${key}`] = value;
      }
    }

    return this.userModel.findByIdAndUpdate(userId, { $set: updates }, { new: true }).exec();
  }

  toProfile(document: UserDocument): UserProfile {
    return {
      id: document.id,
      name: document.name,
      email: document.email,
      phone: document.phone,
      currency: document.currency,
      emailVerified: document.emailVerified,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  async exportUserData(userId: string) {
    const [userDoc, expenses, budgets, goals, customCategories] = await Promise.all([
      this.userModel.findById(userId).lean().exec(),
      this.expenseModel.find({ userId }).sort({ date: -1 }).lean().exec(),
      this.budgetModel.find({ userId }).sort({ year: -1, month: -1 }).lean().exec(),
      this.goalModel.find({ userId }).sort({ targetDate: 1 }).lean().exec(),
      this.categoryModel.find({ userId }).sort({ name: 1 }).lean().exec(),
    ]);

    if (!userDoc) {
      return null;
    }

    return {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        appName: 'SpendWise',
        userId,
      },
      profile: {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone,
        currency: userDoc.currency,
        emailVerified: userDoc.emailVerified,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      },
      notificationPreferences: userDoc.notificationPreferences ?? defaultNotificationPreferences,
      expenses: expenses.map((e) => ({
        id: e._id.toString(),
        amount: e.amount,
        categoryId: e.categoryId,
        description: e.description,
        paymentMethod: e.paymentMethod,
        date: e.date,
        notes: e.notes,
        createdAt: e.createdAt,
      })),
      budgets: budgets.map((b) => ({
        id: b._id.toString(),
        categoryId: b.categoryId,
        limitAmount: b.limitAmount,
        month: b.month,
        year: b.year,
        createdAt: b.createdAt,
      })),
      goals: goals.map((g) => ({
        id: g._id.toString(),
        title: g.title,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
        notes: g.notes,
        createdAt: g.createdAt,
      })),
      customCategories: customCategories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        icon: c.icon,
        color: c.color,
        createdAt: c.createdAt,
      })),
    };
  }

  async clearUserExpenses(userId: string) {
    const result = await this.expenseModel.deleteMany({ userId }).exec();
    return { deletedCount: result.deletedCount };
  }

  async deleteUserCascade(userId: string) {
    await Promise.all([
      this.expenseModel.deleteMany({ userId }).exec(),
      this.budgetModel.deleteMany({ userId }).exec(),
      this.goalModel.deleteMany({ userId }).exec(),
      this.categoryModel.deleteMany({ userId }).exec(),
      this.userModel.findByIdAndDelete(userId).exec(),
    ]);

    return { success: true };
  }
}
