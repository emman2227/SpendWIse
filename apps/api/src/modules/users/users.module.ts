import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BudgetModel, BudgetSchema } from '../budgets/budget.schema';
import { CategoryModel, CategorySchema } from '../categories/category.schema';
import { ExpenseModel, ExpenseSchema } from '../expenses/expense.schema';
import { GoalModel, GoalSchema } from '../goals/goal.schema';
import { UserModel, UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: ExpenseModel.name, schema: ExpenseSchema },
      { name: BudgetModel.name, schema: BudgetSchema },
      { name: GoalModel.name, schema: GoalSchema },
      { name: CategoryModel.name, schema: CategorySchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
