import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BudgetsModule } from '../budgets/budgets.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { CategoryModel, CategorySchema } from './category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CategoryModel.name, schema: CategorySchema }]),
    ExpensesModule,
    BudgetsModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesRepository, CategoriesService],
  exports: [CategoriesRepository, CategoriesService],
})
export class CategoriesModule {}
