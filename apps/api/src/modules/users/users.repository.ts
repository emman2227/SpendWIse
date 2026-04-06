import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { UserProfile } from '@spendwise/shared';
import type { Model } from 'mongoose';

import { type UserDocument, UserModel } from './user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(UserModel.name) private readonly userModel: Model<UserModel>) {}

  create(input: { name: string; email: string; passwordHash: string }) {
    return this.userModel.create(input);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  updatePendingRegistration(userId: string, input: { name: string; passwordHash: string }) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          name: input.name,
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

  toProfile(document: UserDocument): UserProfile {
    return {
      id: document.id,
      name: document.name,
      email: document.email,
      emailVerified: document.emailVerified,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
