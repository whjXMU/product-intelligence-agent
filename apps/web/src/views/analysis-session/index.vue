<template>
  <AnalysisSessionShell>
    <template #sidebar>
      <SessionSidebar
        :sessions="sessions"
        :selected-session-id="selectedSessionId"
        :sessions-loading="sessionsLoading || activeSessionLoading"
        :session-error="sessionErrorMessage || activeSessionErrorMessage"
        @new-session="newSession"
        @select-session="openSession"
        @delete-session="deleteSession"
      />
    </template>

    <template #main>
      <AgentConsole
        v-model:prompt="prompt"
        :session="session"
        :submitting="submitting"
        :can-submit="canSubmit"
        :error-message="agentErrorMessage"
        :error="agentError"
        @submit="submitAndRefresh"
        @clear-prompt="clearPrompt"
      />
    </template>

    <template #aside>
      <DebugPanel :session="session" :error-message="agentErrorMessage" />
    </template>
  </AnalysisSessionShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AnalysisSessionShell from './components/AnalysisSessionShell.vue'
import AgentConsole from './components/AgentConsole.vue'
import DebugPanel from './components/DebugPanel.vue'
import SessionSidebar from './components/SessionSidebar.vue'
import { useAgentConsole } from './composables/useAgentConsole.ts'
import { useActiveSession } from './composables/useActiveSession.ts'
import { useSessionList } from './composables/useSessionList.ts'

const route = useRoute()
const router = useRouter()

const {
  prompt,
  activeSession: session,
  submitting,
  canSubmit,
  errorMessage: agentErrorMessage,
  error: agentError,
  submitPrompt,
  setSession,
  clearSession,
  clearPrompt,
  reset: resetConsole,
} = useAgentConsole()

const {
  sessions,
  loading: sessionsLoading,
  errorMessage: sessionErrorMessage,
  loadSessions,
  removeSession,
} = useSessionList()

const {
  selectedSessionId,
  loading: activeSessionLoading,
  errorMessage: activeSessionErrorMessage,
} = useActiveSession(
  route,
  session,
  setSession,
  clearSession,
)

async function openSession(id: string) {
  await router.push({ name: 'analysis-session-detail', params: { sessionId: id } })
}

async function submitAndRefresh() {
  const completedSession = await submitPrompt()

  if (completedSession) {
    if (selectedSessionId.value !== completedSession.id) {
      await router.replace({
        name: 'analysis-session-detail',
        params: { sessionId: completedSession.id },
      })
    }

    await loadSessions()
  }
}

async function newSession() {
  resetConsole()
  await router.push({ name: 'analysis-sessions' })
}

async function deleteSession(id: string) {
  const isActive = selectedSessionId.value === id
  const deleted = await removeSession(id)

  if (!deleted) {
    ElMessage.error('删除 Session 失败')
    return
  }

  if (isActive) {
    clearSession()
    await router.push({ name: 'analysis-sessions' })
  }
}

onMounted(() => {
  void loadSessions()
})
</script>
