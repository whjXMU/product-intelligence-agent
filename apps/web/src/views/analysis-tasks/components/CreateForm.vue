<template>
  <el-form class="task-form" label-position="top" @submit.prevent="submit">
    <div class="form-heading">
      <div>
        <p class="eyebrow">新建任务</p>
        <h2>分析输入</h2>
      </div>
      <el-button :icon="MagicStick" text type="primary" @click="fillExample">
        填入示例
      </el-button>
    </div>

    <el-form-item label="任务标题" required>
      <el-input v-model="form.title" maxlength="200" />
    </el-form-item>

    <div class="field-row">
      <el-form-item label="己方产品" required>
        <el-input v-model="form.productName" maxlength="120" />
      </el-form-item>

      <el-form-item label="竞品名称" required>
        <el-input v-model="form.competitorName" maxlength="120" />
      </el-form-item>
    </div>

    <el-form-item label="分析目标" required>
      <el-input v-model="form.analysisGoal" type="textarea" :rows="3" />
    </el-form-item>

    <div class="field-row">
      <el-form-item label="己方 URL">
        <el-input v-model="form.selfUrl" type="url" />
      </el-form-item>

      <el-form-item label="竞品 URL">
        <el-input v-model="form.competitorUrl" type="url" />
      </el-form-item>
    </div>

    <el-form-item label="补充说明">
      <el-input v-model="form.notes" type="textarea" :rows="3" />
    </el-form-item>

    <el-button :icon="Plus" type="primary" native-type="submit" :loading="creating">
      创建任务
    </el-button>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus'
import { MagicStick, Plus } from '@element-plus/icons-vue'
import type { CreateAnalysisTaskRequest } from '@product-intelligence-agent/shared'

defineProps<{
  creating: boolean
}>()

const emit = defineEmits<{
  create: [request: CreateAnalysisTaskRequest]
}>()

const emptyForm = {
  title: '',
  productName: '',
  competitorName: '',
  analysisGoal: '',
  selfUrl: '',
  competitorUrl: '',
  notes: '',
}

const exampleForm = {
  title: 'OpenAI 与 DeepSeek 首页竞品分析',
  productName: 'OpenAI',
  competitorName: 'DeepSeek',
  analysisGoal: '比较首页定位、核心卖点、用户转化路径',
  selfUrl: 'https://openai.com',
  competitorUrl: 'https://deepseek.com',
  notes: '关注首屏价值主张、CTA 入口和面向开发者的信任证明。',
}

const form = ref({ ...emptyForm })

function fillExample() {
  form.value = { ...exampleForm }
}

function submit() {
  emit('create', {
    title: form.value.title.trim(),
    productName: form.value.productName.trim(),
    competitorName: form.value.competitorName.trim(),
    analysisGoal: form.value.analysisGoal.trim(),
    sourceType: 'manual',
    input: {
      selfUrl: optionalValue(form.value.selfUrl),
      competitorUrl: optionalValue(form.value.competitorUrl),
      notes: optionalValue(form.value.notes),
    },
  })
}

function optionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
</script>

<style scoped lang="scss">
.task-form {
  display: grid;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 22px;
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}

.form-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 900px) {
  .form-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
