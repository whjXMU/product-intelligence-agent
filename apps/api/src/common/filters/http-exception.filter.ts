import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@product-intelligence-agent/shared';
import type { Request, Response } from 'express';
import { ErrorCodes } from '../errors/error-codes';
import type { RequestWithRequestId } from '../middleware/request-id.middleware';

interface NormalizedErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithRequestId & Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorBody = this.normalizeError(exception, status);
    const requestId = request.requestId ?? 'unknown';
    const traceId = request.traceId ?? requestId;
    const body: ApiErrorResponse = {
      code: errorBody.code,
      message: errorBody.message,
      data: null,
      ...(errorBody.details === undefined
        ? {}
        : { error: { details: errorBody.details } }),
      meta: {
        requestId,
        traceId,
        timestamp: new Date().toISOString(),
        path: request.originalUrl,
      },
    };

    response.status(status).json(body);
  }

  private normalizeError(
    exception: unknown,
    status: number,
  ): NormalizedErrorBody {
    if (!(exception instanceof HttpException)) {
      return {
        code: ErrorCodes.CORE_INTERNAL_ERROR,
        message: 'Internal server error',
      };
    }

    const response = exception.getResponse();

    if (this.isCustomErrorResponse(response)) {
      return response;
    }

    if (typeof response === 'string') {
      return {
        code: this.codeFromStatus(status),
        message: response,
      };
    }

    if (this.isNestErrorResponse(response)) {
      return {
        code: this.codeFromStatus(status),
        message: Array.isArray(response.message)
          ? response.message.join('; ')
          : response.message,
      };
    }

    return {
      code: this.codeFromStatus(status),
      message: exception.message,
    };
  }

  private codeFromStatus(status: number): string {
    if (status === 400) {
      return ErrorCodes.CORE_VALIDATION_FAILED;
    }

    if (status === 404) {
      return ErrorCodes.CORE_NOT_FOUND;
    }

    return ErrorCodes.CORE_INTERNAL_ERROR;
  }

  private isCustomErrorResponse(value: unknown): value is NormalizedErrorBody {
    return (
      typeof value === 'object' &&
      value !== null &&
      'code' in value &&
      typeof value.code === 'string' &&
      'message' in value &&
      typeof value.message === 'string'
    );
  }

  private isNestErrorResponse(
    value: unknown,
  ): value is { message: string | string[] } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      (typeof value.message === 'string' || Array.isArray(value.message))
    );
  }
}
