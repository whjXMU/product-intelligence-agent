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

  <section class="workspace" aria-label="竞品分析任务工作台">
    <AnalysisTaskCreateForm :creating="creating" @create="createTask" />
    <AnalysisTaskList
      :tasks="tasks"
      :selected-task-id="null"
      :loading="tasksLoading"
      @select="openTask"
    />
  </section>

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
import { ElAlert, ElButton } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import type { CreateAnalysisTaskRequest } from '@product-intelligence-agent/shared'
import HealthStatusStrip from '../../shared/system/components/HealthStatusStrip.vue'
import { useHealthCheck } from '../../shared/system/composables/useHealthCheck'
import AnalysisTaskCreateForm from './components/AnalysisTaskCreateForm.vue'
import AnalysisTaskList from './components/AnalysisTaskList.vue'
import { useAnalysisTaskList } from './composables/useAnalysisTaskList'

const router = useRouter()

const {
  tasks,
  tasksLoading,
  creating,
  taskErrorMessage,
  taskError,
  loadTasks,
  submitTask,
} = useAnalysisTaskList()

const { health, healthLoading, healthErrorMessage, databaseStatusText, loadHealth } = useHealthCheck()

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

async function createTask(request: CreateAnalysisTaskRequest) {
  const task = await submitTask(request)
  if (task) {
    await router.push({ name: 'analysis-task-detail', params: { id: task.id } })
  }
}

async function openTask(id: string) {
  await router.push({ name: 'analysis-task-detail', params: { id } })
}

onMounted(() => {
  void loadHealth()
  void loadTasks()
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

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.85fr);
  gap: 18px;
  margin-top: 22px;
}

@media (max-width: 900px) {
  .workspace-header {
    align-items: stretch;
    flex-direction: column;
  }

  .status-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace {
    grid-template-columns: 1fr;
  }
}
</style>
