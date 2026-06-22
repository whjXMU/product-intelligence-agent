<script setup lang="ts">
import { ref } from 'vue'
import type { CreateAnalysisTaskRequest } from '@product-intelligence-agent/shared'

defineProps<{
  creating: boolean
}>()

const emit = defineEmits<{
  create: [request: CreateAnalysisTaskRequest]
}>()

const form = ref({
  title: 'OpenAI 与 DeepSeek 首页竞品分析',
  productName: 'OpenAI',
  competitorName: 'DeepSeek',
  analysisGoal: '比较首页定位、核心卖点、用户转化路径',
  selfUrl: 'https://openai.com',
  competitorUrl: 'https://deepseek.com',
  notes: '当前阶段只保存输入，不抓取网页。',
})

function submit() {
  emit('create', {
    title: form.value.title,
    productName: form.value.productName,
    competitorName: form.value.competitorName,
    analysisGoal: form.value.analysisGoal,
    sourceType: 'manual',
    input: {
      selfUrl: form.value.selfUrl,
      competitorUrl: form.value.competitorUrl,
      notes: form.value.notes,
    },
  })
}
</script>

<template>
  <form class="task-form" @submit.prevent="submit">
    <div class="section-heading">
      <p class="eyebrow">新建任务</p>
      <h2>分析输入</h2>
    </div>

    <label>
      <span>任务标题</span>
      <input v-model="form.title" required maxlength="200" />
    </label>

    <div class="field-row">
      <label>
        <span>己方产品</span>
        <input v-model="form.productName" required maxlength="120" />
      </label>

      <label>
        <span>竞品名称</span>
        <input v-model="form.competitorName" required maxlength="120" />
      </label>
    </div>

    <label>
      <span>分析目标</span>
      <textarea v-model="form.analysisGoal" required rows="3" />
    </label>

    <div class="field-row">
      <label>
        <span>己方 URL</span>
        <input v-model="form.selfUrl" type="url" />
      </label>

      <label>
        <span>竞品 URL</span>
        <input v-model="form.competitorUrl" type="url" />
      </label>
    </div>

    <label>
      <span>补充说明</span>
      <textarea v-model="form.notes" rows="3" />
    </label>

    <button class="primary-button" type="submit" :disabled="creating">
      {{ creating ? '创建中' : '创建任务' }}
    </button>
  </form>
</template>
