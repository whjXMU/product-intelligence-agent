<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisTaskDto } from '@product-intelligence-agent/shared'
import {
  formatTaskDate,
  getTaskStatusText,
  isMockResult,
  isMockTrace,
} from '../utils/analysisTaskDisplay'

const props = defineProps<{
  task: AnalysisTaskDto | null
  detailLoading: boolean
  runningMock: boolean
}>()

const emit = defineEmits<{
  runMock: []
}>()

const taskResult = computed(() => {
  const result = props.task?.result ?? null
  if (!isMockResult(result)) return null
  return result
})

const taskTrace = computed(() => {
  const trace = props.task?.trace ?? null
  if (!isMockTrace(trace)) return null
  return trace
})
</script>

<template>
  <section class="detail-panel" aria-label="任务详情">
    <div class="section-heading inline-heading">
      <div>
        <p class="eyebrow">任务详情</p>
        <h2>{{ task?.title ?? '等待选择任务' }}</h2>
      </div>

      <button
        class="primary-button compact"
        type="button"
        :disabled="!task || runningMock"
        @click="emit('runMock')"
      >
        {{ runningMock ? '生成中' : '运行 mock 分析' }}
      </button>
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

      <section v-if="taskResult" class="report-block report">
        <div class="report-summary">
          <span class="label">Mock 报告</span>
          <p>{{ taskResult.summary }}</p>
        </div>

        <div class="report-columns">
          <div>
            <h3>定位对比</h3>
            <ul>
              <li v-for="item in taskResult.positioningComparison" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div>
            <h3>优势</h3>
            <ul>
              <li v-for="item in taskResult.strengths" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div>
            <h3>机会点</h3>
            <ul>
              <li v-for="item in taskResult.opportunities" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div>
            <h3>建议</h3>
            <ul>
              <li v-for="item in taskResult.recommendations" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-else class="empty-state report-placeholder">
        当前任务还没有报告，点击“运行 mock 分析”生成阶段 02 的模拟结果。
      </section>

      <section v-if="taskTrace" class="report-block">
        <h3>执行 Trace</h3>
        <ol class="trace-list">
          <li v-for="step in taskTrace.steps" :key="`${step.name}-${step.timestamp}`">
            <strong>{{ step.name }}</strong>
            <span>{{ step.message }}</span>
          </li>
        </ol>
      </section>
    </div>

    <div v-else class="empty-state">选择左侧任务后查看详情和 mock 报告。</div>
  </section>
</template>
