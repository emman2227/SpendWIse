import type { ArgumentMetadata,PipeTransform } from '@nestjs/common';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';

@Injectable()
export class ZodValidationPipe<TSchema extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' && metadata.type !== 'query') {
      return value;
    }

    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: result.error.flatten(),
      });
    }

    return result.data;
  }
}
