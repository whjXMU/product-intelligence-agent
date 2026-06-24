<template>
  <section class="debug-panel" aria-label="Session 调试信息">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Debug</p>
        <h2>Session 状态</h2>
      </div>
      <el-tag v-if="session" :type="statusTagType" effect="light">
        {{ getSessionStatusText(session.status) }}
      </el-tag>
    </div>

    <el-empty v-if="!session && !errorMessage" :image-size="90" description="暂无 Session" />

    <el-alert
      v-if="errorMessage"
      type="error"
      :title="errorMessage"
      show-icon
      :closable="false"
    />

    <template v-if="session">
      <dl class="meta-list">
        <div>
          <dt>Session ID</dt>
          <dd>{{ session.id }}</dd>
        </div>
        <div>
          <dt>消息数</dt>
          <dd>{{ session.messages.length }}</dd>
        </div>
        <div>
          <dt>更新时间</dt>
          <dd>{{ formatSessionDate(session.updatedAt) }}</dd>
        </div>
      </dl>

      <details class="raw-block" open>
        <summary>Trace / Raw</summary>
        <pre>{{ raw }}</pre>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisSessionDto } from '@product-intelligence-agent/shared'
import { ElAlert, ElEmpty, ElTag } from 'element-plus'
import {
  formatSessionDate,
  getSessionStatusTagType,
  getSessionStatusText,
} from '../utils/sessionDisplay'

const props = defineProps<{
  session: AnalysisSessionDto | null
  errorMessage: string
}>()

const statusTagType = computed(() => {
  if (!props.session) {
    return 'info'
  }

  return getSessionStatusTagType(props.session.status)
})

const raw = computed(() => {
  if (!props.session) {
    return ''
  }

  return JSON.stringify(
    {
      id: props.session.id,
      status: props.session.status,
      messages: props.session.messages,
      trace: props.session.trace,
      errorMessage: props.session.errorMessage,
      updatedAt: props.session.updatedAt,
    },
    null,
    2,
  )
})
</script>

<style scoped lang="scss">
.debug-panel {
  display: grid;
  gap: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 18px;
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-heading h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 18px;
  line-height: 1.35;
}

.meta-list {
  display: grid;
  gap: 10px;
  margin: 0;
}

.meta-list div {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px;
  background: #f8fafc;
}

.meta-list dt {
  margin-bottom: 4px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 700;
}

.meta-list dd {
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
}

.raw-block {
  color: var(--color-muted);
  font-size: 13px;
}

.raw-block summary {
  cursor: pointer;
  font-weight: 700;
}

.raw-block pre {
  overflow: auto;
  max-height: 420px;
  margin: 10px 0 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  background: #0f172a;
  color: #e5edf7;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
