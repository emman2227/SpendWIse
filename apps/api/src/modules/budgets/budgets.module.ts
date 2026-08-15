import { forwardRef,Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CategoriesModule } from '../categories/categories.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { BudgetModel, BudgetSchema } from './budget.schema';
import { BudgetAlertsService } from './budget-alerts.service';
import { BudgetsController } from './budgets.controller';
import { BudgetsRepository } from './budgets.repository';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BudgetModel.name, schema: BudgetSchema }]),
    ExpensesModule,
    MailModule,
    UsersModule,
    forwardRef(() => CategoriesModule),
  ],
  controllers: [BudgetsController],
  providers: [BudgetsRepository, BudgetsService, BudgetAlertsService],
  exports: [BudgetsRepository, BudgetsService],
})
export class BudgetsModule {}
