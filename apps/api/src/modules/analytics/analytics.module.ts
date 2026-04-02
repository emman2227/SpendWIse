import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { BudgetsModule } from '../budgets/budgets.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { AnalyticsController } from './analytics.controller';
import { ForecastModel, ForecastSchema } from './forecast.schema';
import { InsightModel, InsightSchema } from './insight.schema';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    ConfigModule,
    ExpensesModule,
    BudgetsModule,
    MongooseModule.forFeature([
      { name: InsightModel.name, schema: InsightSchema },
      { name: ForecastModel.name, schema: ForecastSchema }
    ])
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsRepository, AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
