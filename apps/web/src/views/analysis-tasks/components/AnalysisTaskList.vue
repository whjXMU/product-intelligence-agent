<script setup lang="ts">
import type { AnalysisTaskListItemDto } from '@product-intelligence-agent/shared'
import { formatTaskDate, getTaskStatusText } from '../utils/analysisTaskDisplay'

defineProps<{
  tasks: AnalysisTaskListItemDto[]
  selectedTaskId: string | null
  loading: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <section class="task-list" aria-label="任务列表">
    <div class="section-heading inline-heading">
      <div>
        <p class="eyebrow">任务列表</p>
        <h2>{{ tasks.length }} 个任务</h2>
      </div>
      <span v-if="loading" class="muted">加载中</span>
    </div>

    <div v-if="tasks.length === 0 && !loading" class="empty-state">
      还没有任务，先创建一个竞品分析任务。
    </div>

    <button
      v-for="task in tasks"
      :key="task.id"
      class="task-item"
      :class="{ active: selectedTaskId === task.id }"
      type="button"
      @click="emit('select', task.id)"
    >
      <span class="task-title">{{ task.title }}</span>
      <span class="task-meta">{{ task.productName }} vs {{ task.competitorName }}</span>
      <span class="task-footer">
        <span class="status-pill" :class="`status-${task.status}`">
          {{ getTaskStatusText(task.status) }}
        </span>
        <span>{{ formatTaskDate(task.createdAt) }}</span>
      </span>
    </button>
  </section>
</template>
