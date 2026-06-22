export function formatUnknownError(error: unknown, fallback: string) {
  return error instanceof Error ? `${fallback}：${error.message}` : fallback
}
