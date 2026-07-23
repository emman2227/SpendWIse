import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationPreferences } from '@spendwise/shared';

import type { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.toProfile(user);
  }

  async updateProfile(userId: string, input: { name?: string; phone?: string }) {
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
}
