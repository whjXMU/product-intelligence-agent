<script setup lang="ts">
import type { HealthCheckResponse } from '@product-intelligence-agent/shared'

defineProps<{
  health: HealthCheckResponse | null
  databaseStatusText: string
  loading: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <section class="health-strip" aria-label="系统状态">
    <div>
      <span class="label">API</span>
      <strong>{{ health?.service.status === 'ok' ? '运行中' : '等待检测' }}</strong>
    </div>
    <div>
      <span class="label">PostgreSQL</span>
      <strong>{{ databaseStatusText }}</strong>
    </div>
    <div>
      <span class="label">Agent Core</span>
      <strong>{{ health?.agent.status === 'reserved' ? '已预留' : '等待检测' }}</strong>
    </div>
    <button class="ghost-button" type="button" :disabled="loading" @click="emit('refresh')">
      {{ loading ? '检测中' : '刷新 health' }}
    </button>
  </section>

<p v-if="errorMessage" class="muted health-error">{{ errorMessage }}</p>
</template>

<style scoped lang="scss">
.health-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: center;
  margin-top: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 14px;
  color: var(--color-muted);
  background: var(--color-surface);

  strong {
    display: block;
    margin-top: 4px;
    color: var(--color-text-secondary);
    font-size: 14px;
  }
}

.health-error {
  margin: 10px 0 0;
}

@media (max-width: 900px) {
  .health-strip {
    grid-template-columns: 1fr;
  }
}
</style>
