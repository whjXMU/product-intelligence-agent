import type {
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
} from '@product-intelligence-agent/shared'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId?: string
  readonly traceId?: string
  readonly details?: unknown

  constructor(options: {
    code: string
    message: string
    status: number
    requestId?: string
    traceId?: string
    details?: unknown
  }) {
    super(options.message)
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
    this.requestId = options.requestId
    this.traceId = options.traceId
    this.details = options.details
  }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const body = (await response.json()) as unknown

  if (!isApiResponse<T>(body)) {
    throw new ApiError({
      code: 'core.invalid_response',
      message: `Invalid API response for ${path}`,
      status: response.status,
      requestId: response.headers.get('x-request-id') ?? undefined,
    })
  }

  if (!response.ok || !isApiSuccessResponse<T>(body)) {
    const errorBody = body as ApiErrorResponse
    throw new ApiError({
      code: errorBody.code,
      message: errorBody.message,
      status: response.status,
      requestId: errorBody.meta.requestId,
      traceId: errorBody.meta.traceId,
      details: errorBody.error?.details,
    })
  }

  return body.data
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== 'object' || value === null) return false
  if (!('code' in value) || typeof value.code !== 'string') return false
  if (!('message' in value) || typeof value.message !== 'string') return false
  if (!('meta' in value) || typeof value.meta !== 'object' || value.meta === null) return false

  const meta = value.meta as Record<string, unknown>
  return (
    typeof meta.requestId === 'string' &&
    typeof meta.traceId === 'string' &&
    typeof meta.timestamp === 'string' &&
    typeof meta.path === 'string' &&
    'data' in value
  )
}

function isApiSuccessResponse<T>(value: ApiResponse<T>): value is ApiSuccessResponse<T> {
  return value.code === 'core.ok'
}
