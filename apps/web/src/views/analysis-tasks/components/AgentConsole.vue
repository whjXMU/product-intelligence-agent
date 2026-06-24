<template>
  <section class="agent-console" aria-label="Agent 联调入口">
    <div class="console-heading">
      <div>
        <p class="eyebrow">Agent 联调</p>
        <h2>自然语言分析入口</h2>
      </div>
      <el-button :icon="MagicStick" text type="primary" @click="fillExample">
        填入示例
      </el-button>
    </div>

    <el-form class="console-form" @submit.prevent="emit('submit')">
      <el-input
        v-model="promptModel"
        type="textarea"
        :rows="7"
        maxlength="2000"
        show-word-limit
        resize="vertical"
        placeholder="描述你想分析的问题，例如：帮我分析 OpenAI 和 DeepSeek 首页的竞品差异，重点看定位、转化路径和企业可信度。"
      />

      <div class="console-actions">
        <el-button :disabled="submitting" @click="emit('reset')">清空</el-button>
        <el-button
          :icon="Promotion"
          type="primary"
          native-type="submit"
          :loading="submitting"
          :disabled="!canSubmit"
        >
          创建并运行
        </el-button>
      </div>
    </el-form>

    <el-alert
      v-if="errorMessage"
      class="console-alert"
      type="error"
      :title="errorMessage"
      show-icon
      :closable="false"
    >
      <template v-if="error" #default>
        <div class="error-meta">
          <span>错误码：{{ error.code }}</span>
          <span v-if="error.requestId">Request ID：{{ error.requestId }}</span>
        </div>
      </template>
    </el-alert>

    <section v-if="session" class="session-panel" aria-label="当前 Agent Session">
      <div class="session-summary">
        <div>
          <p class="eyebrow">当前 Session</p>
          <h3>{{ session.title }}</h3>
        </div>
        <el-tag :type="statusTagType" effect="light">
          {{ getSessionStatusText(session.status) }}
        </el-tag>
      </div>

      <div class="result-block">
        <p class="block-label">运行结果</p>
        <pre v-if="session.resultText">{{ session.resultText }}</pre>
        <el-empty v-else :image-size="80" description="等待运行结果" />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisSessionDto } from '@product-intelligence-agent/shared'
import { ElAlert, ElButton, ElEmpty, ElForm, ElInput, ElTag } from 'element-plus'
import { MagicStick, Promotion } from '@element-plus/icons-vue'
import type { ApiError } from '../../../shared/api/http'
import {
  getSessionStatusTagType,
  getSessionStatusText,
} from '../utils/analysisTaskDisplay'

const props = defineProps<{
  prompt: string
  session: AnalysisSessionDto | null
  submitting: boolean
  canSubmit: boolean
  errorMessage: string
  error: ApiError | null
}>()

const emit = defineEmits<{
  'update:prompt': [value: string]
  submit: []
  reset: []
}>()

const promptModel = computed({
  get: () => props.prompt,
  set: (value: string) => emit('update:prompt', value),
})

const examplePrompt =
  '帮我分析 OpenAI 和 DeepSeek 首页的竞品差异，重点看定位、转化路径和企业可信度。'

const statusTagType = computed(() => {
  if (!props.session) {
    return 'info'
  }

  return getSessionStatusTagType(props.session.status)
})

function fillExample() {
  emit('update:prompt', examplePrompt)
}
</script>

<style scoped lang="scss">
.agent-console {
  display: grid;
  gap: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 22px;
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}

.console-heading,
.session-summary,
.console-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.console-form {
  display: grid;
  gap: 14px;
}

.console-actions {
  align-items: center;
  justify-content: flex-end;
}

.console-alert {
  margin: 0;
}

.error-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
}

.session-panel {
  display: grid;
  gap: 16px;
  border-top: 1px solid var(--color-border);
  padding-top: 18px;
}

.session-summary h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 18px;
  line-height: 1.35;
}

.block-label {
  margin: 0 0 6px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 700;
}

.result-block {
  display: grid;
  gap: 8px;
}

.result-block pre {
  overflow: auto;
  max-height: 340px;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 14px;
  background: #0f172a;
  color: #e5edf7;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .console-heading,
  .session-summary,
  .console-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
