import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
export const TRACE_ID_HEADER = 'x-trace-id';

export interface RequestWithRequestId extends Request {
  requestId?: string;
  traceId?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithRequestId, res: Response, next: NextFunction): void {
    const incomingRequestId = req.header(REQUEST_ID_HEADER);
    const requestId =
      incomingRequestId && incomingRequestId.trim().length > 0
        ? incomingRequestId
        : randomUUID();
    const incomingTraceId = req.header(TRACE_ID_HEADER);
    const traceId =
      incomingTraceId && incomingTraceId.trim().length > 0
        ? incomingTraceId
        : requestId;

    req.requestId = requestId;
    req.traceId = traceId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    res.setHeader(TRACE_ID_HEADER, traceId);

    next();
  }
}
