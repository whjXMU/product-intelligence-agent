import type { HealthCheckResponse } from '@product-intelligence-agent/shared'
import { requestJson } from '../../api/http'

export function getHealth() {
  return requestJson<HealthCheckResponse>('/health')
}
