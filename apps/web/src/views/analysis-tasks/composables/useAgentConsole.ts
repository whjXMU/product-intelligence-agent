import { computed, ref } from 'vue'
import type { AnalysisSessionDto } from '@product-intelligence-agent/shared'
import {
  createAnalysisSession,
  runAnalysisSession,
} from '../api/analysisTasks.api'
import { ApiError } from '../../../shared/api/http'
import { formatUnknownError } from '../../../shared/utils/error'

export function useAgentConsole() {
  const prompt = ref('')
  const activeSession = ref<AnalysisSessionDto | null>(null)
  const creating = ref(false)
  const running = ref(false)
  const errorMessage = ref('')
  const error = ref<ApiError | null>(null)

  const submitting = computed(() => creating.value || running.value)
  const canSubmit = computed(
    () => prompt.value.trim().length > 0 && !submitting.value,
  )

  async function submitPrompt() {
    const initialPrompt = prompt.value.trim()

    if (!initialPrompt || submitting.value) {
      return null
    }

    errorMessage.value = ''
    error.value = null
    creating.value = true

    try {
      const session = await createAnalysisSession({ initialPrompt })
      activeSession.value = session
      creating.value = false
      running.value = true

      const completedSession = await runAnalysisSession(session.id)
      activeSession.value = completedSession
      return completedSession
    } catch (submitError) {
      errorMessage.value = formatUnknownError(submitError, 'Agent 联调失败')
      error.value = submitError instanceof ApiError ? submitError : null
      return null
    } finally {
      creating.value = false
      running.value = false
    }
  }

  function reset() {
    prompt.value = ''
    activeSession.value = null
    errorMessage.value = ''
    error.value = null
  }

  function clearSession() {
    activeSession.value = null
    errorMessage.value = ''
    error.value = null
  }

  function setSession(session: AnalysisSessionDto) {
    activeSession.value = session
    prompt.value = ''
    errorMessage.value = ''
    error.value = null
  }

  return {
    prompt,
    activeSession,
    creating,
    running,
    submitting,
    canSubmit,
    errorMessage,
    error,
    submitPrompt,
    setSession,
    clearSession,
    reset,
  }
}
