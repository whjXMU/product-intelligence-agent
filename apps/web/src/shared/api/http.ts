import type {
  ApiErrorResponse,
  ApiResponse,
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

export async function requestJson<T>(path: string, conifg?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...conifg,
    headers: {
      'Content-Type': 'application/json',
      ...conifg?.headers,
    },
  })

  const body = (await response.json()) as unknown

  if (!isApiEnvelope(body)) {
    throw new ApiError({
      code: 'core.invalid_response',
      message: `Invalid API response for ${path}`,
      status: response.status,
      requestId: response.headers.get('x-request-id') ?? undefined,
    })
  }

  if (body.code !== 'core.ok') {
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

  if (!response.ok) {
    throw new ApiError({
      code: 'core.http_error',
      message: `Unexpected HTTP status ${response.status} for ${path}`,
      status: response.status,
      requestId: body.meta.requestId,
      traceId: body.meta.traceId,
    })
  }

  return ('data' in body ? body.data : null) as T
}

function isApiEnvelope(value: unknown): value is Pick<ApiResponse<unknown>, 'code' | 'message' | 'meta'> {
  if (typeof value !== 'object' || value === null) return false
  if (!('code' in value) || typeof value.code !== 'string') return false
  if (!('message' in value) || typeof value.message !== 'string') return false
  if (!('meta' in value) || typeof value.meta !== 'object' || value.meta === null) return false

  const meta = value.meta as Record<string, unknown>
  return (
    typeof meta.requestId === 'string' &&
    typeof meta.traceId === 'string' &&
    typeof meta.timestamp === 'string' &&
    typeof meta.path === 'string'
  )
}
