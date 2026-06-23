   <template>
  <section v-if="workflowResult" class="report-block report">
    <div class="report-summary">
      <span class="label">Workflow 报告</span>
      <p>{{ workflowResult.executiveSummary.oneLine }}</p>
      <p class="muted">
        置信度：{{ getConfidenceText(workflowResult.executiveSummary.confidence) }}
        · 生成时间：{{ formatTaskDate(workflowResult.generatedAt) }}
      </p>
    </div>

    <div>
      <h3>关键发现</h3>
      <ul>
        <li v-for="item in workflowResult.executiveSummary.keyFindings" :key="item">
          {{ item }}
        </li>
      </ul>
    </div>

    <div>
      <h3>对比维度</h3>
      <div class="stack-list">
        <article
          v-for="dimension in workflowResult.comparisonDimensions"
          :key="dimension.id"
          class="summary-item"
        >
          <h4>{{ dimension.name }}</h4>
          <p><strong>己方：</strong>{{ dimension.selfAssessment }}</p>
          <p><strong>竞品：</strong>{{ dimension.competitorAssessment }}</p>
          <p><strong>差距：</strong>{{ dimension.gap }}</p>
        </article>
      </div>
    </div>

    <div class="report-columns">
      <div>
        <h3>机会点</h3>
        <div class="stack-list">
          <article
            v-for="opportunity in workflowResult.opportunities"
            :key="opportunity.id"
            class="summary-item"
          >
            <h4>{{ opportunity.title }}</h4>
            <p>{{ opportunity.rationale }}</p>
            <p class="muted">
              影响：{{ getImpactText(opportunity.impact) }}
              · 成本：{{ getEffortText(opportunity.effort) }}
            </p>
          </article>
        </div>
      </div>
      <div>
        <h3>建议</h3>
        <div class="stack-list">
          <article
            v-for="recommendation in workflowResult.recommendations"
            :key="recommendation.id"
            class="summary-item"
          >
            <h4>{{ getPriorityText(recommendation.priority) }} · {{ recommendation.title }}</h4>
            <p>{{ recommendation.description }}</p>
            <p v-if="recommendation.successMetric" class="muted">
              成功指标：{{ recommendation.successMetric }}
            </p>
          </article>
        </div>
      </div>
    </div>

    <div>
      <h3>质量检查</h3>
      <p>
        {{ workflowResult.quality.passed ? '通过' : '未通过' }}
        · 评分 {{ Math.round(workflowResult.quality.score * 100) }}%
      </p>
      <ul>
        <li v-for="check in workflowResult.quality.checks" :key="check.name">
          {{ check.passed ? '通过' : '未通过' }}：{{ check.name }} - {{ check.message }}
        </li>
      </ul>
    </div>
  </section>

  <section v-else-if="mockResult" class="report-block report">
    <div class="report-summary">
      <span class="label">Mock 报告</span>
      <p>{{ mockResult.summary }}</p>
    </div>

    <div class="report-columns">
      <div>
        <h3>定位对比</h3>
        <ul>
          <li v-for="item in mockResult.positioningComparison" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div>
        <h3>优势</h3>
        <ul>
          <li v-for="item in mockResult.strengths" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div>
        <h3>机会点</h3>
        <ul>
          <li v-for="item in mockResult.opportunities" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div>
        <h3>建议</h3>
        <ul>
          <li v-for="item in mockResult.recommendations" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>
  </section>

  <section v-else class="empty-state report-placeholder">
    当前任务还没有报告，点击“运行 Agent 分析”生成阶段 03 结果，或运行 mock 分析查看阶段 02 兼容结果。
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisTaskDto } from '@product-intelligence-agent/shared'
import {
  formatTaskDate,
  getConfidenceText,
  getEffortText,
  getImpactText,
  getPriorityText,
  isAnalysisTaskResultV1,
  isMockResult,
} from '../utils/analysisTaskDisplay'

const props = defineProps<{
  result: AnalysisTaskDto['result']
}>()

const workflowResult = computed(() => {
  if (!isAnalysisTaskResultV1(props.result)) return null
  return props.result
})

const mockResult = computed(() => {
  if (!isMockResult(props.result)) return null
  return props.result
})
</script>

<style scoped lang="scss">
.report-block {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 18px;
  background: var(--color-surface);

  p {
    margin-bottom: 0;
    color: var(--color-text-secondary);
    line-height: 1.75;
  }
}

.report {
  display: grid;
  gap: 18px;
  background: var(--color-surface-soft);
}

.report-summary p {
  margin-top: 8px;
  font-size: 16px;
}

.report-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  > div {
    border-top: 1px solid var(--color-border);
    padding-top: 14px;
  }
}

.stack-list {
  display: grid;
  gap: 12px;
}

.summary-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  padding: 13px;
  background: var(--color-surface);

  h4 {
    margin: 0 0 8px;
    color: var(--color-text);
    font-size: 14px;
    line-height: 1.45;
  }

  p + p {
    margin-top: 6px;
  }
}

.report-placeholder {
  text-align: center;
}

@media (max-width: 900px) {
  .report-columns {
    grid-template-columns: 1fr;
  }
}
</style>
