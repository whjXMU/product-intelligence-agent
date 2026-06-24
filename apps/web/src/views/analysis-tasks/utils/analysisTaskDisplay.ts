import type {
  AgentTraceV1,
  AnalysisSessionDto,
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  AnalysisTaskMockResult,
  AnalysisTaskResultV1,
  AnalysisTaskTrace,
} from '@product-intelligence-agent/shared'
import { formatDateTime } from '../../../shared/utils/date'

export function formatTaskDate(value: string) {
  return formatDateTime(value)
}

export function getTaskStatusText(status: AnalysisTaskListItemDto['status']) {
  const statusMap: Record<AnalysisTaskListItemDto['status'], string> = {
    created: '待分析',
    running: '分析中',
    completed: '已完成',
    failed: '失败',
  }

  return statusMap[status]
}

export function getTaskStatusTagType(status: AnalysisTaskListItemDto['status']) {
  const typeMap: Record<
    AnalysisTaskListItemDto['status'],
    'info' | 'primary' | 'success' | 'danger'
  > = {
    created: 'info',
    running: 'primary',
    completed: 'success',
    failed: 'danger',
  }

  return typeMap[status]
}

export function getSessionStatusText(status: AnalysisSessionDto['status']) {
  const statusMap: Record<AnalysisSessionDto['status'], string> = {
    drafting: '讨论中',
    brief_ready: 'Brief 待确认',
    ready_to_run: '待执行',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
  }

  return statusMap[status]
}

export function getSessionStatusTagType(status: AnalysisSessionDto['status']) {
  const typeMap: Record<
    AnalysisSessionDto['status'],
    'info' | 'warning' | 'success' | 'danger'
  > = {
    drafting: 'info',
    brief_ready: 'warning',
    ready_to_run: 'warning',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  }

  return typeMap[status]
}

export function isMockResult(value: AnalysisTaskDto['result']): value is AnalysisTaskMockResult {
  return (
    !!value &&
    typeof value === 'object' &&
    !('schemaVersion' in value) &&
    'summary' in value &&
    'recommendations' in value &&
    Array.isArray((value as AnalysisTaskMockResult).recommendations)
  )
}

export function isAnalysisTaskResultV1(
  value: AnalysisTaskDto['result'],
): value is AnalysisTaskResultV1 {
  return (
    !!value &&
    typeof value === 'object' &&
    'schemaVersion' in value &&
    value.schemaVersion === 'analysis_task_result.v1'
  )
}

export function isMockTrace(value: AnalysisTaskDto['trace']): value is AnalysisTaskTrace {
  return (
    !!value &&
    typeof value === 'object' &&
    !('schemaVersion' in value) &&
    'mode' in value &&
    'steps' in value &&
    Array.isArray((value as AnalysisTaskTrace).steps)
  )
}

export function isAgentTraceV1(value: AnalysisTaskDto['trace']): value is AgentTraceV1 {
  return (
    !!value &&
    typeof value === 'object' &&
    'schemaVersion' in value &&
    value.schemaVersion === 'agent_trace.v1'
  )
}

export function getConfidenceText(confidence: AnalysisTaskResultV1['executiveSummary']['confidence']) {
  const confidenceMap: Record<AnalysisTaskResultV1['executiveSummary']['confidence'], string> = {
    low: '低',
    medium: '中',
    high: '高',
  }

  return confidenceMap[confidence]
}

type AnalysisTaskOpportunityV1 = AnalysisTaskResultV1['opportunities'][number]
type AnalysisTaskRecommendationV1 = AnalysisTaskResultV1['recommendations'][number]

export function getImpactText(value: AnalysisTaskOpportunityV1['impact']) {
  const impactMap: Record<AnalysisTaskOpportunityV1['impact'], string> = {
    low: '低',
    medium: '中',
    high: '高',
  }

  return impactMap[value]
}

export function getEffortText(value: AnalysisTaskOpportunityV1['effort']) {
  const effortMap: Record<AnalysisTaskOpportunityV1['effort'], string> = {
    low: '低',
    medium: '中',
    high: '高',
  }

  return effortMap[value]
}

export function getPriorityText(priority: AnalysisTaskRecommendationV1['priority']) {
  const priorityMap: Record<AnalysisTaskRecommendationV1['priority'], string> = {
    p0: 'P0',
    p1: 'P1',
    p2: 'P2',
  }

  return priorityMap[priority]
}

export function getTraceStatusText(status: AgentTraceV1['status']) {
  const statusMap: Record<AgentTraceV1['status'], string> = {
    running: '运行中',
    completed: '已完成',
    failed: '失败',
  }

  return statusMap[status]
}
