import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { ApiSuccessResponse } from '@product-intelligence-agent/shared';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';
import { ErrorCodes } from '../errors/error-codes';
import type { RequestWithRequestId } from '../middleware/request-id.middleware';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithRequestId & Request>();

    return next.handle().pipe(
      map((data: unknown): ApiSuccessResponse<unknown> => {
        const requestId = request.requestId ?? 'unknown';
        const traceId = request.traceId ?? requestId;

        return {
          code: ErrorCodes.CORE_OK,
          message: 'OK',
          data: data ?? null,
          meta: {
            requestId,
            traceId,
            timestamp: new Date().toISOString(),
            path: request.originalUrl,
          },
        };
      }),
    );
  }
}
