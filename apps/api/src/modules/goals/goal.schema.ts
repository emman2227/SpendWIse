import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'goals',
  timestamps: true,
  versionKey: false,
})
export class GoalModel {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  targetAmount!: number;

  @Prop({ required: true, default: 0 })
  currentAmount!: number;

  @Prop({ required: true })
  targetDate!: Date;

  @Prop()
  notes?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type GoalDocument = HydratedDocument<GoalModel>;
export const GoalSchema = SchemaFactory.createForClass(GoalModel);
