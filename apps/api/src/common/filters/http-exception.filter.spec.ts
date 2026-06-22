import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@product-intelligence-agent/shared';
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
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: [{ path: ['title'] }],
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    const body = response.json.mock.calls[0]?.[0];
    expect(body?.success).toBe(false);
    expect(body?.error.code).toBe('VALIDATION_ERROR');
    expect(body?.error.message).toBe('Invalid request body');
    expect(body?.meta.requestId).toBe('request-1');
    expect(body?.meta.path).toBe('/analysis-tasks');
  });

  it('maps not found errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, response } = createHost();

    filter.catch(new NotFoundException('missing task'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    const body = response.json.mock.calls[0]?.[0];
    expect(body?.error.code).toBe('NOT_FOUND');
    expect(body?.error.message).toBe('missing task');
  });
});
