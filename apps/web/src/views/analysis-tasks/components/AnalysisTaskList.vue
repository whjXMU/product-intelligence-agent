<template>
  <section class="task-list" aria-label="任务列表">
    <div class="section-heading inline-heading">
      <div>
        <p class="eyebrow">任务列表</p>
        <h2>{{ tasks.length }} 个任务</h2>
      </div>
      <el-tag v-if="loading" type="info">加载中</el-tag>
    </div>

    <el-empty v-if="tasks.length === 0 && !loading" description="还没有任务" />

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
        <el-tag :type="getStatusTagType(task.status)" effect="light">
          {{ getTaskStatusText(task.status) }}
        </el-tag>
        <span>{{ formatTaskDate(task.createdAt) }}</span>
      </span>
    </button>
  </section>
</template>

<script setup lang="ts">
import { ElEmpty, ElTag } from 'element-plus'
import type {
  AnalysisTaskListItemDto,
  AnalysisTaskStatus,
} from '@product-intelligence-agent/shared'
import { formatTaskDate, getTaskStatusText } from '../utils/analysisTaskDisplay'

defineProps<{
  tasks: AnalysisTaskListItemDto[]
  selectedTaskId: string | null
  loading: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

function getStatusTagType(status: AnalysisTaskStatus) {
  const typeMap: Record<AnalysisTaskStatus, 'info' | 'primary' | 'success' | 'danger'> = {
    created: 'info',
    running: 'primary',
    completed: 'success',
    failed: 'danger',
  }

  return typeMap[status]
}
</script>

<style scoped lang="scss">
.task-list {
  max-height: 620px;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 18px;
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}

.task-item {
  display: grid;
  width: 100%;
  gap: 8px;
  margin-top: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 14px;
  text-align: left;
  color: inherit;
  background: var(--color-surface-soft);
  cursor: pointer;

  &:hover,
  &.active {
    border-color: var(--color-primary);
    background: var(--color-surface-accent);
  }
}

.task-title {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.45;
}

.task-meta {
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .task-list {
    max-height: none;
  }
}
</style>
