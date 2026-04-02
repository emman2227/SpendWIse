import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'insights',
  timestamps: true,
  versionKey: false
})
export class InsightModel {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type InsightDocument = HydratedDocument<InsightModel>;
export const InsightSchema = SchemaFactory.createForClass(InsightModel);
