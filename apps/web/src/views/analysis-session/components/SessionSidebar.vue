<template>
  <nav class="session-sidebar" aria-label="Session 导航">
    <section class="nav-section">
      <div class="section-heading inline-heading">
        <div>
          <p class="eyebrow">Sessions</p>
          <h2>{{ sessions.length }} 个会话</h2>
        </div>
        <div class="heading-actions">
          <el-tag v-if="sessionsLoading" type="info">加载中</el-tag>
          <el-button :icon="Plus" size="small" text type="primary" @click="emit('new-session')">
            新会话
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="sessionError"
        class="nav-alert"
        type="error"
        :title="sessionError"
        show-icon
        :closable="false"
      />

      <el-empty v-if="sessions.length === 0 && !sessionsLoading" description="还没有会话" />

      <button
        v-for="session in sessions"
        :key="session.id"
        class="nav-item"
        :class="{ active: selectedSessionId === session.id }"
        type="button"
        @click="emit('select-session', session.id)"
      >
        <span class="item-row">
          <span class="item-title">{{ session.title }}</span>
          <el-button
            :icon="Delete"
            circle
            text
            type="danger"
            :aria-label="`删除 ${session.title}`"
            @click.stop="emit('delete-session', session.id)"
          />
        </span>
        <span class="item-footer">
          <el-tag :type="getSessionStatusTagType(session.status)" effect="light">
            {{ getSessionStatusText(session.status) }}
          </el-tag>
          <span>{{ formatSessionDate(session.updatedAt) }}</span>
        </span>
      </button>
    </section>
  </nav>
</template>

<script setup lang="ts">
import { ElAlert, ElButton, ElEmpty, ElTag } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { AnalysisSessionListItemDto } from '@product-intelligence-agent/shared'
import {
  formatSessionDate,
  getSessionStatusTagType,
  getSessionStatusText,
} from '../utils/sessionDisplay'

defineProps<{
  sessions: AnalysisSessionListItemDto[]
  selectedSessionId: string | null
  sessionsLoading: boolean
  sessionError: string
}>()

const emit = defineEmits<{
  'new-session': []
  'select-session': [id: string]
  'delete-session': [id: string]
}>()
</script>

<style scoped lang="scss">
.session-sidebar {
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 16px;
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
  height: 100%;
}

.nav-section + .nav-section {
  margin-top: 20px;
  border-top: 1px solid var(--color-border);
  padding-top: 18px;
}

.nav-alert {
  margin: 10px 0;
}

.heading-actions,
.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.nav-item {
  display: grid;
  width: 100%;
  gap: 8px;
  margin-top: 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
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

.item-title {
  min-width: 0;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.item-meta {
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.45;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .session-sidebar {
    max-height: none;
  }
}
</style>
