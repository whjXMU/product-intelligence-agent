import { ApiError } from '../api/http'

export function formatUnknownError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const requestHint = error.requestId ? `（requestId: ${error.requestId}）` : ''
    return `${fallback}：${error.message} [${error.code}]${requestHint}`
  }

  return error instanceof Error ? `${fallback}：${error.message}` : fallback
}
