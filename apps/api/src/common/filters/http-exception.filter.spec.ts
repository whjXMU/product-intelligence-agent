import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@product-intelligence-agent/shared';
import { ErrorCodes } from '../errors/error-codes';
import { HttpExceptionFilter } from './http-exception.filter';

const createHost = () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn<void, [ApiErrorResponse]>(),
  };
  const request = {
    requestId: 'request-1',
    originalUrl: '/analysis-tasks',
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ArgumentsHost;

  return { host, response };
};

describe('HttpExceptionFilter', () => {
  it('formats custom validation errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, response } = createHost();

    filter.catch(
      new BadRequestException({
        code: ErrorCodes.CORE_VALIDATION_FAILED,
        message: 'Invalid request body',
        details: [{ path: ['title'] }],
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    const body = response.json.mock.calls[0]?.[0];
    expect(body?.code).toBe(ErrorCodes.CORE_VALIDATION_FAILED);
    expect(body?.message).toBe('Invalid request body');
    expect(body?.data).toBeNull();
    expect(body?.error?.details).toEqual([{ path: ['title'] }]);
    expect(body?.meta.requestId).toBe('request-1');
    expect(body?.meta.traceId).toBe('request-1');
    expect(body?.meta.path).toBe('/analysis-tasks');
  });

  it('maps not found errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, response } = createHost();

    filter.catch(new NotFoundException('missing task'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    const body = response.json.mock.calls[0]?.[0];
    expect(body?.code).toBe(ErrorCodes.CORE_NOT_FOUND);
    expect(body?.message).toBe('missing task');
    expect(body?.data).toBeNull();
  });
});
