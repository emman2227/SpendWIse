import { Inject, Injectable, Logger } from '@nestjs/common';
import { DEFAULT_PROMPT_TEMPLATES, renderPrompt } from '@spendwise/ai';

import { PromptRepository } from './prompt.repository';

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);

  constructor(@Inject(PromptRepository) private readonly promptRepository: PromptRepository) {}

  /**
   * Retrieve a prompt template by type, falling back to the default template
   * if no database entry exists.
   */
  async getRenderedPrompt(
    type: string,
    variables: Record<string, string>,
  ): Promise<{ prompt: string; version: number }> {
    const dbPrompt = await this.promptRepository.findByType(type);

    if (dbPrompt) {
      return {
        prompt: renderPrompt(dbPrompt.template, variables),
        version: dbPrompt.version,
      };
    }

    const defaultTemplate = DEFAULT_PROMPT_TEMPLATES.find((t) => t.type === type);

    if (!defaultTemplate) {
      this.logger.warn(`No prompt template found for type "${type}". Using empty prompt.`);
      return { prompt: '', version: 0 };
    }

    return {
      prompt: renderPrompt(defaultTemplate.template, variables),
      version: defaultTemplate.version,
    };
  }

  /**
   * Upsert a prompt template in the database.
   */
  async upsertPrompt(type: string, version: number, template: string) {
    return this.promptRepository.upsert(type, version, template);
  }

  /**
   * Seed default prompt templates into the database if they don't already exist.
   */
  async seedDefaults(): Promise<number> {
    let seeded = 0;

    for (const template of DEFAULT_PROMPT_TEMPLATES) {
      const existing = await this.promptRepository.findByType(template.type);

      if (!existing) {
        await this.promptRepository.upsert(template.type, template.version, template.template);
        seeded++;
      }
    }

    return seeded;
  }
}
