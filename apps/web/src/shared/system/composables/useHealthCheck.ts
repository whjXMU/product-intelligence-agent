import { computed, ref } from 'vue'
import type { HealthCheckResponse } from '@product-intelligence-agent/shared'
import { formatUnknownError } from '../../utils/error'
import { getHealth } from '../api/health.api'

export function useHealthCheck() {
  const health = ref<HealthCheckResponse | null>(null)
  const healthLoading = ref(false)
  const healthErrorMessage = ref('')

  const databaseStatusText = computed(() => {
    if (!health.value) return '等待检测'
    return health.value.database.status === 'ok' ? '连接正常' : '连接异常'
  })

  async function loadHealth() {
    healthLoading.value = true
    healthErrorMessage.value = ''

    try {
      health.value = await getHealth()
    } catch (error) {
      healthErrorMessage.value = formatUnknownError(error, 'Health check 失败')
      health.value = null
    } finally {
      healthLoading.value = false
    }
  }

  return {
    health,
    healthLoading,
    healthErrorMessage,
    databaseStatusText,
    loadHealth,
  }
}
