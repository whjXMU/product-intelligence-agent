<template>
  <section class="agent-console" aria-label="Agent 联调入口">
    <div class="console-heading">
      <div>
        <p class="eyebrow">Agent 联调</p>
        <h2>{{ session?.title ?? '自然语言分析入口' }}</h2>
      </div>
      <div class="heading-actions">
        <el-tag v-if="session" :type="statusTagType" effect="light">
          {{ getSessionStatusText(session.status) }}
        </el-tag>
        <el-button :icon="MagicStick" text type="primary" @click="fillExample">
          填入示例
        </el-button>
      </div>
    </div>

    <AgentMessageList
      :messages="session?.messages ?? []"
      :submitting="submitting"
    />

    <el-form class="console-form" @submit.prevent="emit('submit')">
      <el-input
        v-model="promptModel"
        type="textarea"
        :rows="4"
        maxlength="2000"
        show-word-limit
        resize="vertical"
        placeholder="继续描述你的分析需求，例如：帮我分析 OpenAI 和 DeepSeek 首页的竞品差异，重点看定位、转化路径和企业可信度。"
      />

      <div class="console-actions">
        <el-button :disabled="submitting" @click="emit('clear-prompt')">清空</el-button>
        <el-button
          :icon="Promotion"
          type="primary"
          native-type="submit"
          :loading="submitting"
          :disabled="!canSubmit"
        >
          发送
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
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisSessionDto } from '@product-intelligence-agent/shared'
import { ElAlert, ElButton, ElForm, ElInput, ElTag } from 'element-plus'
import { MagicStick, Promotion } from '@element-plus/icons-vue'
import type { ApiError } from '../../../shared/api/http'
import AgentMessageList from './AgentMessageList.vue'
import {
  getSessionStatusTagType,
  getSessionStatusText,
} from '../utils/sessionDisplay'

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
  'clear-prompt': []
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
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 22px;
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}

.console-heading,
.heading-actions,
.console-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.console-form {
  display: grid;
  gap: 14px;
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
}

.console-actions {
  align-items: center;
  justify-content: flex-end;
}

.heading-actions {
  align-items: center;
  flex: 0 0 auto;
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

.console-heading h2 {
  max-width: 720px;
  margin: 0;
  color: var(--color-text);
  font-size: 22px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

@media (max-width: 900px) {
  .console-heading,
  .heading-actions,
  .console-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
