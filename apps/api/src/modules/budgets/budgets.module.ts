import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ExpensesModule } from '../expenses/expenses.module';
import { BudgetModel, BudgetSchema } from './budget.schema';
import { BudgetsController } from './budgets.controller';
import { BudgetsRepository } from './budgets.repository';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BudgetModel.name, schema: BudgetSchema }]),
    ExpensesModule
  ],
  controllers: [BudgetsController],
  providers: [BudgetsRepository, BudgetsService],
  exports: [BudgetsRepository, BudgetsService]
})
export class BudgetsModule {}
