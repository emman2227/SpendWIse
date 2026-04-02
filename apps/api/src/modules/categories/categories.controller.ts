import { Body, Controller, Get, Post, UseGuards, UsePipes } from '@nestjs/common';

import { createCategorySchema } from '@spendwise/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';

import { CategoriesService } from './categories.service';

@Controller({
  path: 'categories',
  version: '1'
})
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.categoriesService.list(user.userId);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createCategorySchema))
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; icon: string; color: string },
  ) {
    return this.categoriesService.create(user.userId, body);
  }
}
