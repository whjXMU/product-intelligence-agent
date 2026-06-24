<template>
  <section class="message-list" aria-label="会话消息">
    <el-empty
      v-if="messages.length === 0"
      :image-size="96"
      description="从一个分析问题开始"
    />

    <article
      v-for="message in messages"
      :key="message.id"
      class="message"
      :class="`message-${message.role}`"
    >
      <div class="message-meta">
        <span>{{ getRoleLabel(message.role) }}</span>
        <time :datetime="message.createdAt">{{ formatSessionDate(message.createdAt) }}</time>
      </div>
      <p>{{ message.content }}</p>
    </article>

    <article v-if="submitting" class="message message-assistant pending">
      <div class="message-meta">
        <span>Agent</span>
        <span>运行中</span>
      </div>
      <p>正在处理你的分析需求...</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { AnalysisSessionMessage } from '@product-intelligence-agent/shared'
import { ElEmpty } from 'element-plus'
import { formatSessionDate, getSessionMessageRoleText } from '../utils/sessionDisplay'

defineProps<{
  messages: AnalysisSessionMessage[]
  submitting: boolean
}>()

function getRoleLabel(role: AnalysisSessionMessage['role']) {
  return getSessionMessageRoleText(role)
}
</script>

<style scoped lang="scss">
.message-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.message {
  max-width: min(760px, 86%);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--color-surface-soft);
}

.message-user {
  align-self: flex-end;
  border-color: #bfd9e5;
  background: #f0f8fb;
}

.message-assistant,
.message-system {
  align-self: flex-start;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 700;
}

.message p {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.pending p {
  color: var(--color-text-secondary);
}

@media (max-width: 900px) {
  .message {
    max-width: 100%;
  }
}
</style>
