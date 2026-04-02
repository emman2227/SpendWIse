import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ExpenseModel, ExpenseSchema } from './expense.schema';
import { ExpensesController } from './expenses.controller';
import { ExpensesRepository } from './expenses.repository';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ExpenseModel.name, schema: ExpenseSchema }])
  ],
  controllers: [ExpensesController],
  providers: [ExpensesRepository, ExpensesService],
  exports: [ExpensesRepository, ExpensesService]
})
export class ExpensesModule {}
