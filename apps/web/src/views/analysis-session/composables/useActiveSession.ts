import { computed, ref, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router'
import type { AnalysisSessionDto } from '@product-intelligence-agent/shared'
import { getAnalysisSession } from '../api/analysisSessions.api'
import { ApiError } from '../../../shared/api/http'
import { formatUnknownError } from '../../../shared/utils/error'

export function useActiveSession(
  route: RouteLocationNormalizedLoadedGeneric,
  activeSession: Ref<AnalysisSessionDto | null>,
  setSession: (session: AnalysisSessionDto) => void,
  clearSession: () => void,
) {
  const loading = ref(false)
  const errorMessage = ref('')
  const error = ref<ApiError | null>(null)

  const selectedSessionId = computed(() => {
    const sessionId = route.params.sessionId

    return typeof sessionId === 'string' ? sessionId : null
  })

  const stop = watch(
    selectedSessionId,
    async (sessionId) => {
      if (!sessionId) {
        errorMessage.value = ''
        error.value = null
        clearSession()
        return
      }

      if (activeSession.value?.id === sessionId) {
        return
      }

      loading.value = true
      errorMessage.value = ''
      error.value = null

      try {
        const selected = await getAnalysisSession(sessionId)
        setSession(selected)
      } catch (loadError) {
        errorMessage.value = formatUnknownError(loadError, '加载 Session 详情失败')
        error.value = loadError instanceof ApiError ? loadError : null
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  return {
    selectedSessionId,
    loading,
    errorMessage,
    error,
    stop,
  }
}
