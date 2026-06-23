import type { NextFunction, Response } from 'express';
import {
  REQUEST_ID_HEADER,
  RequestIdMiddleware,
  TRACE_ID_HEADER,
  type RequestWithRequestId,
} from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  it('uses incoming request id when present', () => {
    const middleware = new RequestIdMiddleware();
    const setHeader = jest.fn();
    const req = {
      header: jest.fn((name: string) =>
        name === REQUEST_ID_HEADER ? 'request-id-from-client' : undefined,
      ),
    } as unknown as RequestWithRequestId;
    const res = {
      setHeader,
    } as unknown as Response;
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe('request-id-from-client');
    expect(req.traceId).toBe('request-id-from-client');
    expect(setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'request-id-from-client',
    );
    expect(setHeader).toHaveBeenCalledWith(
      TRACE_ID_HEADER,
      'request-id-from-client',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('uses incoming trace id when present', () => {
    const middleware = new RequestIdMiddleware();
    const setHeader = jest.fn();
    const req = {
      header: jest.fn((name: string) => {
        if (name === REQUEST_ID_HEADER) return 'request-id-from-client';
        if (name === TRACE_ID_HEADER) return 'trace-id-from-client';
        return undefined;
      }),
    } as unknown as RequestWithRequestId;
    const res = {
      setHeader,
    } as unknown as Response;
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe('request-id-from-client');
    expect(req.traceId).toBe('trace-id-from-client');
    expect(setHeader).toHaveBeenCalledWith(
      TRACE_ID_HEADER,
      'trace-id-from-client',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates request id when header is missing', () => {
    const middleware = new RequestIdMiddleware();
    const setHeader = jest.fn();
    const req = {
      header: jest.fn(() => undefined),
    } as unknown as RequestWithRequestId;
    const res = {
      setHeader,
    } as unknown as Response;
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toEqual(expect.any(String));
    expect(req.traceId).toBe(req.requestId);
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, req.requestId);
    expect(setHeader).toHaveBeenCalledWith(TRACE_ID_HEADER, req.requestId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
