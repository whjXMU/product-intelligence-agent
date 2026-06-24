<template>
  <section class="page-toolbar">
    <RouterLink class="ghost-link" to="/analysis-tasks">返回任务工作台</RouterLink>
  </section>

  <p v-if="detailErrorMessage" class="error">{{ detailErrorMessage }}</p>

  <AnalysisTaskDetailPanel
    :task="task"
    :latest-run="latestRun"
    :detail-loading="detailLoading"
    :running-mock="runningMock"
    :running-agent="runningAgent"
    @run-mock="runMock"
    @run-agent="runAgent"
  />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AnalysisTaskDetailPanel from './components/AnalysisTaskDetailPanel.vue'
import { useAnalysisTaskDetail } from './composables/useAnalysisTaskDetail'

const route = useRoute()
const {
  task,
  latestRun,
  detailLoading,
  runningMock,
  runningAgent,
  detailErrorMessage,
  loadTask,
  runMock,
  runAgent,
} = useAnalysisTaskDetail()

const taskId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : id
})

watch(
  taskId,
  (id) => {
    if (id) {
      void loadTask(id)
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.ghost-link {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  padding: 0 13px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}
</style>
