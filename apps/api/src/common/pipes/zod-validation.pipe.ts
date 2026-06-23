import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';
import { ErrorCodes } from '../errors/error-codes';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: ErrorCodes.CORE_VALIDATION_FAILED,
          message: 'Invalid request body',
          details: error.issues,
        });
      }

      throw error;
    }
  }
}
