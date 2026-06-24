import { ref } from 'vue'
import type {
  AnalysisSessionDto,
  AnalysisSessionListItemDto,
} from '@product-intelligence-agent/shared'
import {
  deleteAnalysisSession,
  getAnalysisSession,
  listAnalysisSessions,
} from '../api/analysisTasks.api'
import { ApiError } from '../../../shared/api/http'
import { formatUnknownError } from '../../../shared/utils/error'

export function useSessionList() {
  const sessions = ref<AnalysisSessionListItemDto[]>([])
  const selectedSessionId = ref<string | null>(null)
  const loading = ref(false)
  const selecting = ref(false)
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

  async function selectSession(id: string): Promise<AnalysisSessionDto | null> {
    selectedSessionId.value = id
    selecting.value = true
    errorMessage.value = ''
    error.value = null

    try {
      return await getAnalysisSession(id)
    } catch (selectError) {
      errorMessage.value = formatUnknownError(selectError, '加载 Session 详情失败')
      error.value = selectError instanceof ApiError ? selectError : null
      return null
    } finally {
      selecting.value = false
    }
  }

  function selectLocalSession(session: AnalysisSessionDto) {
    selectedSessionId.value = session.id
  }

  function clearSelection() {
    selectedSessionId.value = null
  }

  async function removeSession(id: string): Promise<boolean> {
    try {
      await deleteAnalysisSession(id)
      if (selectedSessionId.value === id) {
        clearSelection()
      }
      await loadSessions()
      return true
    } catch (deleteError) {
      console.error('[analysis-session] delete failed', deleteError)
      return false
    }
  }

  return {
    sessions,
    selectedSessionId,
    loading,
    selecting,
    errorMessage,
    error,
    loadSessions,
    selectSession,
    selectLocalSession,
    clearSelection,
    removeSession,
  }
}
