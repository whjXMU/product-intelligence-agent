<template>
  <section class="workspace-header">
    <div>
      <h1>竞品分析工作台</h1>
      <p class="lead">创建分析任务、运行 Agent、追踪最近一次分析状态。</p>
    </div>

    <el-button :icon="Refresh" :loading="tasksLoading" type="primary" @click="loadTasks">
      刷新
    </el-button>
  </section>

  <section class="status-strip" aria-label="任务状态概览">
    <div v-for="item in taskStats" :key="item.label" class="status-metric">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </div>
  </section>

  <el-alert
    v-if="taskErrorMessage"
    class="error-alert"
    type="error"
    :title="taskErrorMessage"
    show-icon
    :closable="false"
  >
    <template v-if="taskError" #default>
      <div class="error-meta">
        <span>错误码：{{ taskError.code }}</span>
        <span v-if="taskError.requestId">Request ID：{{ taskError.requestId }}</span>
      </div>
      <el-button size="small" @click="loadTasks">重试</el-button>
    </template>
  </el-alert>

  <WorkspaceShell>
    <template #sidebar>
      <WorkspaceNav
        :sessions="sessions"
        :selected-session-id="selectedSessionId"
        :sessions-loading="sessionsLoading || selectingSession"
        :session-error="sessionErrorMessage"
        :tasks="tasks"
        :tasks-loading="tasksLoading"
        @new-session="newSession"
        @select-session="openSession"
        @delete-session="deleteSession"
        @select-task="openTask"
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
        @reset="resetConsole"
      />
    </template>

    <template #aside>
      <DebugPanel :session="session" :error-message="agentErrorMessage" />
    </template>
  </WorkspaceShell>

  <HealthStatusStrip
    :health="health"
    :database-status-text="databaseStatusText"
    :loading="healthLoading"
    :error-message="healthErrorMessage"
    @refresh="loadHealth"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElAlert, ElButton, ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import HealthStatusStrip from '../../shared/system/components/HealthStatusStrip.vue'
import { useHealthCheck } from '../../shared/system/composables/useHealthCheck'
import AgentConsole from './components/AgentConsole.vue'
import DebugPanel from './components/DebugPanel.vue'
import WorkspaceNav from './components/WorkspaceNav.vue'
import WorkspaceShell from './components/WorkspaceShell.vue'
import { useAgentConsole } from './composables/useAgentConsole'
import { useAnalysisTaskList } from './composables/useAnalysisTaskList'
import { useSessionList } from './composables/useSessionList'

const router = useRouter()

const {
  tasks,
  tasksLoading,
  taskErrorMessage,
  taskError,
  loadTasks,
} = useAnalysisTaskList()

const { health, healthLoading, healthErrorMessage, databaseStatusText, loadHealth } = useHealthCheck()

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
  reset: resetConsole,
} = useAgentConsole()

const {
  sessions,
  selectedSessionId,
  loading: sessionsLoading,
  selecting: selectingSession,
  errorMessage: sessionErrorMessage,
  loadSessions,
  selectSession,
  selectLocalSession,
  clearSelection,
  removeSession,
} = useSessionList()

const taskStats = computed(() => {
  const running = tasks.value.filter((task) => task.status === 'running').length
  const completed = tasks.value.filter((task) => task.status === 'completed').length
  const failed = tasks.value.filter((task) => task.status === 'failed').length

  return [
    { label: '全部任务', value: tasks.value.length },
    { label: '运行中', value: running },
    { label: '已完成', value: completed },
    { label: '失败', value: failed },
  ]
})

async function openTask(id: string) {
  await router.push({ name: 'analysis-task-detail', params: { id } })
}

async function openSession(id: string) {
  const selected = await selectSession(id)

  if (selected) {
    setSession(selected)
  }
}

async function submitAndRefresh() {
  const session = await submitPrompt()

  if (session) {
    selectLocalSession(session)
    await loadSessions()
  }
}

function newSession() {
  clearSelection()
  resetConsole()
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
  }
}

onMounted(() => {
  void loadHealth()
  void loadTasks()
  void loadSessions()
})
</script>

<style scoped lang="scss">
.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--color-border);
}

.lead {
  max-width: 720px;
  margin-bottom: 0;
  color: #4b5c73;
  font-size: 15px;
  line-height: 1.6;
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.status-metric {
  display: grid;
  gap: 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 14px;
  background: var(--color-surface);
}

.status-metric span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

.status-metric strong {
  color: var(--color-text);
  font-size: 24px;
  line-height: 1;
}

.error-alert {
  margin-top: 16px;
}

.error-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .workspace-header {
    align-items: stretch;
    flex-direction: column;
  }

  .status-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}
</style>
