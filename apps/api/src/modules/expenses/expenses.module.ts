import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ExpenseModel, ExpenseSchema } from './expense.schema';
import { ExpensesController } from './expenses.controller';
import { ExpensesRepository } from './expenses.repository';
import { ExpensesService } from './expenses.service';
import { RecurringExpenseModel, RecurringExpenseSchema } from './recurring-expense.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExpenseModel.name, schema: ExpenseSchema },
      { name: RecurringExpenseModel.name, schema: RecurringExpenseSchema },
    ]),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesRepository, ExpensesService],
  exports: [ExpensesRepository, ExpensesService],
})
export class ExpensesModule {}
