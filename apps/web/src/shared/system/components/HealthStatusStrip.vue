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
