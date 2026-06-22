<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
  loadTasks,
  submitTask,
} = useAnalysisTaskList()

const { health, healthLoading, healthErrorMessage, databaseStatusText, loadHealth } = useHealthCheck()

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

<template>
  <section class="hero">
    <div>
      <p class="eyebrow">阶段 02 / 任务工作台</p>
      <h1>竞品分析任务</h1>
      <p class="lead">创建分析任务、查看 mock 报告，并为后续正式 Agent workflow 保留稳定业务对象。</p>
    </div>

    <button class="secondary-button" type="button" :disabled="tasksLoading" @click="loadTasks">
      {{ tasksLoading ? '刷新中' : '刷新任务' }}
    </button>
  </section>

  <p v-if="taskErrorMessage" class="error">{{ taskErrorMessage }}</p>

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
