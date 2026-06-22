import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  it('returns parsed value when schema matches', () => {
    const pipe = new ZodValidationPipe(
      z.object({
        title: z.string().trim().min(1),
      }),
    );

    expect(pipe.transform({ title: '  demo  ' })).toEqual({ title: 'demo' });
  });

  it('throws BadRequestException when schema does not match', () => {
    const pipe = new ZodValidationPipe(
      z.object({
        title: z.string().min(1),
      }),
    );

    expect(() => pipe.transform({ title: '' })).toThrow(BadRequestException);
  });
});
