import { ref } from 'vue'
import type { AnalysisSessionListItemDto } from '@product-intelligence-agent/shared'
import {
  deleteAnalysisSession,
  listAnalysisSessions,
} from '../api/analysisSessions.api'
import { ApiError } from '../../../shared/api/http'
import { formatUnknownError } from '../../../shared/utils/error'

export function useSessionList() {
  const sessions = ref<AnalysisSessionListItemDto[]>([])
  const loading = ref(false)
  const errorMessage = ref('')
  const error = ref<ApiError | null>(null)

  async function loadSessions() {
    loading.value = true
    errorMessage.value = ''
    error.value = null

    try {
      sessions.value = await listAnalysisSessions()
    } catch (loadError) {
      errorMessage.value = formatUnknownError(loadError, '加载 Session 列表失败')
      error.value = loadError instanceof ApiError ? loadError : null
    } finally {
      loading.value = false
    }
  }

  async function removeSession(id: string): Promise<boolean> {
    try {
      await deleteAnalysisSession(id)
      await loadSessions()
      return true
    } catch (deleteError) {
      console.error('[analysis-session] delete failed', deleteError)
      return false
    }
  }

  return {
    sessions,
    loading,
    errorMessage,
    error,
    loadSessions,
    removeSession,
  }
}
