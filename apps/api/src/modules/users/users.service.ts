import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { compareSync } from '@node-rs/bcrypt';
import type { NotificationPreferences } from '@spendwise/shared';

import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(@Inject(UsersRepository) private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.toProfile(user);
  }

  async updateProfile(userId: string, input: { name?: string; phone?: string; currency?: string }) {
    const user = await this.usersRepository.updateProfile(userId, input);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.toProfile(user);
  }

  async getNotificationPreferences(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.getNotificationPreferences(user);
  }

  async updateNotificationPreferences(userId: string, input: Partial<NotificationPreferences>) {
    const user = await this.usersRepository.updateNotificationPreferences(userId, input);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.getNotificationPreferences(user);
  }

  async exportData(userId: string) {
    const exportResult = await this.usersRepository.exportUserData(userId);

    if (!exportResult) {
      throw new NotFoundException('User not found');
    }

    return exportResult;
  }

  async clearData(userId: string, password: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = compareSync(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password. Data clearing aborted.');
    }

    const { deletedCount } = await this.usersRepository.clearUserExpenses(userId);

    return {
      success: true,
      message: `Successfully deleted ${deletedCount} transaction record(s).`,
      deletedCount,
    };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = compareSync(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password. Account deletion aborted.');
    }

    await this.usersRepository.deleteUserCascade(userId);

    return {
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    };
  }
}
