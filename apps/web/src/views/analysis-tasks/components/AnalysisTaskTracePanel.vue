<template>
  <section v-if="agentTrace" class="trace-panel">
    <h3>Agent Trace</h3>
    <dl class="input-list">
      <div>
        <dt>Run ID</dt>
        <dd>{{ agentTrace.runId }}</dd>
      </div>
      <div>
        <dt>Workflow</dt>
        <dd>{{ agentTrace.workflowVersion }}</dd>
      </div>
      <div>
        <dt>模式 / 状态</dt>
        <dd>{{ agentTrace.mode }} / {{ getTraceStatusText(agentTrace.status) }}</dd>
      </div>
    </dl>

    <h3>Steps</h3>
    <ol class="trace-list">
      <li v-for="step in agentTrace.steps" :key="step.stepId">
        <strong>{{ step.name }}</strong>
        <span>{{ step.status }} · {{ step.summary }}</span>
      </li>
    </ol>

    <div class="trace-grid">
      <div>
        <h3>Model Calls</h3>
        <p v-if="agentTrace.modelCalls.length === 0" class="muted">暂无模型调用记录。</p>
        <ul v-else>
          <li v-for="call in agentTrace.modelCalls" :key="call.id">
            {{ call.provider }} / {{ call.model }} · {{ call.status }}
          </li>
        </ul>
      </div>
      <div>
        <h3>Tool Calls</h3>
        <p v-if="agentTrace.toolCalls.length === 0" class="muted">暂无工具调用记录。</p>
        <ul v-else>
          <li v-for="call in agentTrace.toolCalls" :key="call.id">
            {{ call.toolName }} · {{ call.status }}
          </li>
        </ul>
      </div>
      <div>
        <h3>Guardrails</h3>
        <p v-if="agentTrace.guardrails.length === 0" class="muted">暂无 guardrail 记录。</p>
        <ul v-else>
          <li v-for="guardrail in agentTrace.guardrails" :key="guardrail.id">
            {{ guardrail.passed ? '通过' : '未通过' }} · {{ guardrail.name }}
          </li>
        </ul>
      </div>
    </div>
  </section>

  <section v-else-if="mockTrace" class="trace-panel">
    <h3>Mock Trace</h3>
    <ol class="trace-list">
      <li v-for="step in mockTrace.steps" :key="`${step.name}-${step.timestamp}`">
        <strong>{{ step.name }}</strong>
        <span>{{ step.message }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisTaskDto } from '@product-intelligence-agent/shared'
import { getTraceStatusText, isAgentTraceV1, isMockTrace } from '../utils/analysisTaskDisplay'

const props = defineProps<{
  trace: AnalysisTaskDto['trace']
}>()

const agentTrace = computed(() => {
  if (!isAgentTraceV1(props.trace)) return null
  return props.trace
})

const mockTrace = computed(() => {
  if (!isMockTrace(props.trace)) return null
  return props.trace
})
</script>

<style scoped lang="scss">
.trace-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 18px;
  background: var(--color-surface);
}

.input-list {
  display: grid;
  gap: 10px;
  margin: 0;

  div {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    gap: 12px;
  }

  dt {
    color: var(--color-muted);
    font-weight: 800;
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    color: var(--color-text-secondary);
  }
}

.trace-list {
  display: grid;
  gap: 8px;

  li strong {
    margin-right: 8px;
  }
}

.trace-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;

  > div {
    border-top: 1px solid var(--color-border);
    padding-top: 14px;
  }
}

@media (max-width: 900px) {
  .input-list div,
  .trace-grid {
    grid-template-columns: 1fr;
  }

  .input-list div {
    gap: 4px;
  }
}
</style>
