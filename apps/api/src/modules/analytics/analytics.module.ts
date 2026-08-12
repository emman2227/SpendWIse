import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { BudgetsModule } from '../budgets/budgets.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';
import { ForecastModel, ForecastSchema } from './forecast.schema';
import { InsightModel, InsightSchema } from './insight.schema';
import { PromptRepository } from './prompt.repository';
import { PromptTemplateModel, PromptTemplateSchema } from './prompt.schema';
import { PromptService } from './prompt.service';

@Module({
  imports: [
    ConfigModule,
    ExpensesModule,
    BudgetsModule,
    MongooseModule.forFeature([
      { name: InsightModel.name, schema: InsightSchema },
      { name: ForecastModel.name, schema: ForecastSchema },
      { name: PromptTemplateModel.name, schema: PromptTemplateSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsRepository, AnalyticsService, PromptRepository, PromptService],
  exports: [AnalyticsService, PromptService],
})
export class AnalyticsModule {}
