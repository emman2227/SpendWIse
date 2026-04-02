import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { UserProfile } from '@spendwise/shared';

import { UserModel, type UserDocument } from './user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(UserModel.name) private readonly userModel: Model<UserModel>) {}

  create(input: { name: string; email: string; passwordHash: string }) {
    return this.userModel.create(input);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
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
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    };
  }
}
