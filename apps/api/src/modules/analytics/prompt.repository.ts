import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { type PromptTemplateDocument,PromptTemplateModel } from './prompt.schema';

export interface PromptTemplateDto {
  type: string;
  version: number;
  template: string;
  updatedAt: string;
}

@Injectable()
export class PromptRepository {
  constructor(
    @InjectModel(PromptTemplateModel.name)
    private readonly promptModel: Model<PromptTemplateModel>,
  ) {}

  async findByType(type: string): Promise<PromptTemplateDto | null> {
    const document = await this.promptModel.findOne({ type }).exec();
    return document ? this.toDto(document) : null;
  }

  async upsert(type: string, version: number, template: string): Promise<PromptTemplateDto> {
    const document = await this.promptModel
      .findOneAndUpdate({ type }, { type, version, template }, { upsert: true, new: true })
      .exec();

    if (!document) {
      throw new Error(`Prompt template for type "${type}" could not be persisted`);
    }

    return this.toDto(document);
  }

  async findAll(): Promise<PromptTemplateDto[]> {
    const documents = await this.promptModel.find().sort({ type: 1 }).exec();
    return documents.map((document) => this.toDto(document));
  }

  private toDto(document: PromptTemplateDocument): PromptTemplateDto {
    return {
      type: document.type,
      version: document.version,
      template: document.template,
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
