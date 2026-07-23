import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
  type UserProfile,
} from '@spendwise/shared';
import type { Model } from 'mongoose';

import { type UserDocument, UserModel } from './user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(UserModel.name) private readonly userModel: Model<UserModel>) {}

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

  updateProfile(userId: string, input: { name?: string; phone?: string }) {
    const updates: Record<string, string> = {};

    if (input.name !== undefined) {
      updates.name = input.name;
    }

    if (input.phone !== undefined) {
      updates.phone = input.phone;
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
      emailVerified: document.emailVerified,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
