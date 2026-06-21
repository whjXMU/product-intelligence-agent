<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { HealthCheckResponse } from '@product-intelligence-agent/shared'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const health = ref<HealthCheckResponse | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const databaseStatusText = computed(() => {
  if (!health.value) return '等待检测'
  return health.value.database.status === 'ok' ? '连接正常' : '连接异常'
})

async function loadHealth() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/health`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    health.value = (await response.json()) as HealthCheckResponse
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    health.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadHealth()
})
</script>

<template>
  <main class="shell">
    <section class="summary">
      <div>
        <p class="eyebrow">MVP V0</p>
        <h1>product-intelligence-agent</h1>
        <p class="lead">当前阶段聚焦工程骨架、数据库连接和 Agent 边界预留。</p>
      </div>

      <button class="refresh-button" type="button" :disabled="loading" @click="loadHealth">
        {{ loading ? '检测中' : '刷新状态' }}
      </button>
    </section>

    <section class="status-grid" aria-label="系统状态">
      <article class="status-card">
        <span class="label">API 服务</span>
        <strong>{{ health?.service.status === 'ok' ? '运行中' : '等待检测' }}</strong>
        <small>{{ health?.service.name ?? 'product-intelligence-agent-api' }}</small>
      </article>

      <article class="status-card">
        <span class="label">PostgreSQL</span>
        <strong>{{ databaseStatusText }}</strong>
        <small>{{ health?.database.message ?? '尚未获取数据库状态' }}</small>
      </article>

      <article class="status-card">
        <span class="label">Agent Core</span>
        <strong>{{ health?.agent.status === 'reserved' ? '已预留' : '等待检测' }}</strong>
        <small>{{ health?.agent.message ?? '核心抽象将在后续阶段逐步启用' }}</small>
      </article>
    </section>

    <section class="details" aria-label="健康检查详情">
      <div>
        <span class="label">数据库延迟</span>
        <strong>{{ health?.database.latencyMs ?? '-' }} ms</strong>
      </div>
      <div>
        <span class="label">API 运行时间</span>
        <strong>{{ health?.service.uptimeSeconds ?? '-' }} s</strong>
      </div>
      <div>
        <span class="label">最近检测时间</span>
        <strong>{{ health?.service.timestamp ?? '-' }}</strong>
      </div>
    </section>

    <p v-if="errorMessage" class="error">后端连接失败：{{ errorMessage }}</p>
  </main>
</template>
