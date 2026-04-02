import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'budgets',
  timestamps: true,
  versionKey: false
})
export class BudgetModel {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  categoryId!: string;

  @Prop({ required: true })
  limitAmount!: number;

  @Prop({ required: true })
  month!: number;

  @Prop({ required: true })
  year!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export type BudgetDocument = HydratedDocument<BudgetModel>;
export const BudgetSchema = SchemaFactory.createForClass(BudgetModel);

BudgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });
