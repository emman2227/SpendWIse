import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { createCategorySchema, updateCategorySchema } from '@spendwise/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../../common/types/auth-user.interface';
import type { CategoriesService } from './categories.service';

@Controller({
  path: 'categories',
  version: '1',
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

  @Patch(':categoryId')
  @UsePipes(new ZodValidationPipe(updateCategorySchema))
  update(
    @CurrentUser() user: AuthUser,
    @Param('categoryId') categoryId: string,
    @Body() body: Partial<{ name: string; icon: string; color: string }>,
  ) {
    return this.categoriesService.update(user.userId, categoryId, body);
  }

  @Delete(':categoryId')
  remove(@CurrentUser() user: AuthUser, @Param('categoryId') categoryId: string) {
    return this.categoriesService.delete(user.userId, categoryId);
  }
}
