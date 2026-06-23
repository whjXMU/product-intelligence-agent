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

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 999px;
  padding: 0 9px;
  color: var(--color-text-secondary);
  background: #e9eef5;
  font-weight: 800;
}

.status-created {
  color: #5c4300;
  background: #fff2c2;
}

.status-running {
  color: #0b5870;
  background: #d9f3fb;
}

.status-completed {
  color: #12623b;
  background: #dff7e8;
}

.status-failed {
  color: #8a1f1f;
  background: #ffe1e1;
}

@media (max-width: 900px) {
  .task-list {
    max-height: none;
  }
}
</style>
