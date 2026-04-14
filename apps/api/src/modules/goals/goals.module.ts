import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GoalModel, GoalSchema } from './goal.schema';
import { GoalsController } from './goals.controller';
import { GoalsRepository } from './goals.repository';
import { GoalsService } from './goals.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: GoalModel.name, schema: GoalSchema }])],
  controllers: [GoalsController],
  providers: [GoalsRepository, GoalsService],
  exports: [GoalsRepository, GoalsService],
})
export class GoalsModule {}
