export interface ApiResponseMeta {
  requestId: string;
  traceId: string;
  timestamp: string;
  path: string;
}

export interface ApiErrorPayload {
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  code: 'core.ok';
  message: string;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  data: null;
  error?: ApiErrorPayload;
  meta: ApiResponseMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
