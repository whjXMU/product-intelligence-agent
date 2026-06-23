<template>
  <section class="detail-panel" aria-label="任务详情">
    <div class="section-heading inline-heading">
      <div>
        <p class="eyebrow">任务详情</p>
        <h2>{{ task?.title ?? '等待选择任务' }}</h2>
      </div>

      <div class="action-group">
        <button
          class="primary-button compact"
          type="button"
          :disabled="!task || isRunning"
          @click="emit('runWorkflow')"
        >
          {{ runningWorkflow ? '运行中' : '运行 workflow 分析' }}
        </button>
        <button
          class="ghost-button compact"
          type="button"
          :disabled="!task || isRunning"
          @click="emit('runMock')"
        >
          {{ runningMock ? '生成中' : '运行 mock 分析' }}
        </button>
      </div>
    </div>

    <div v-if="detailLoading" class="empty-state">正在加载任务详情。</div>

    <div v-else-if="task" class="detail-content">
      <div class="detail-grid">
        <div>
          <span class="label">己方产品</span>
          <strong>{{ task.productName }}</strong>
        </div>
        <div>
          <span class="label">竞品</span>
          <strong>{{ task.competitorName }}</strong>
        </div>
        <div>
          <span class="label">状态</span>
          <strong>{{ getTaskStatusText(task.status) }}</strong>
        </div>
        <div>
          <span class="label">更新时间</span>
          <strong>{{ formatTaskDate(task.updatedAt) }}</strong>
        </div>
      </div>

      <section class="report-block">
        <h3>分析目标</h3>
        <p>{{ task.analysisGoal }}</p>
      </section>

      <section class="report-block">
        <h3>输入信息</h3>
        <dl class="input-list">
          <div>
            <dt>己方 URL</dt>
            <dd>{{ task.input.selfUrl || '-' }}</dd>
          </div>
          <div>
            <dt>竞品 URL</dt>
            <dd>{{ task.input.competitorUrl || '-' }}</dd>
          </div>
          <div>
            <dt>补充说明</dt>
            <dd>{{ task.input.notes || '-' }}</dd>
          </div>
        </dl>
      </section>

      <AnalysisTaskResultPanel :result="task.result" />
      <AnalysisTaskTracePanel :trace="task.trace" />
    </div>

    <div v-else class="empty-state">选择左侧任务后查看详情和 mock 报告。</div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisTaskDto } from '@product-intelligence-agent/shared'
import {
  formatTaskDate,
  getTaskStatusText,
} from '../utils/analysisTaskDisplay'
import AnalysisTaskResultPanel from './AnalysisTaskResultPanel.vue'
import AnalysisTaskTracePanel from './AnalysisTaskTracePanel.vue'

const props = defineProps<{
  task: AnalysisTaskDto | null
  detailLoading: boolean
  runningMock: boolean
  runningWorkflow: boolean
}>()

const emit = defineEmits<{
  runMock: []
  runWorkflow: []
}>()

const isRunning = computed(() => props.runningMock || props.runningWorkflow)
</script>

<style scoped lang="scss">
.detail-panel {
  margin-top: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 22px;
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}

.action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.detail-content {
  display: grid;
  gap: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-border);
}

.detail-grid > div {
  min-width: 0;
  padding: 15px;
  background: var(--color-surface-soft);
}

.detail-grid strong {
  display: block;
  margin-top: 7px;
  overflow-wrap: anywhere;
  font-size: 15px;
}

.input-list {
  display: grid;
  gap: 10px;
  margin: 0;
}

.input-list div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 12px;
}

.input-list dt {
  color: var(--color-muted);
  font-weight: 800;
}

.input-list dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-text-secondary);
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .action-group {
    justify-content: stretch;
  }

  .input-list div {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
