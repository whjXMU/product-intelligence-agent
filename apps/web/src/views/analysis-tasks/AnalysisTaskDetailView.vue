<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AnalysisTaskDetailPanel from './components/AnalysisTaskDetailPanel.vue'
import { useAnalysisTaskDetail } from './composables/useAnalysisTaskDetail'

const route = useRoute()
const { task, detailLoading, runningMock, detailErrorMessage, loadTask, runMock } =
  useAnalysisTaskDetail()

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

<template>
  <section class="page-toolbar">
    <RouterLink class="ghost-link" to="/analysis-tasks">返回任务工作台</RouterLink>
  </section>

  <p v-if="detailErrorMessage" class="error">{{ detailErrorMessage }}</p>

  <AnalysisTaskDetailPanel
    :task="task"
    :detail-loading="detailLoading"
    :running-mock="runningMock"
    @run-mock="runMock"
  />
</template>
