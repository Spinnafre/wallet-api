import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { fromZodError, isZodErrorLike } from 'zod-validation-error';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (isZodErrorLike(error)) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: fromZodError(error),
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
