import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'prompt_templates',
  timestamps: true,
  versionKey: false,
})
export class PromptTemplateModel {
  @Prop({ required: true, unique: true, index: true })
  type!: string;

  @Prop({ required: true })
  version!: number;

  @Prop({ required: true })
  template!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type PromptTemplateDocument = HydratedDocument<PromptTemplateModel>;
export const PromptTemplateSchema = SchemaFactory.createForClass(PromptTemplateModel);
