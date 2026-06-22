import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  AnalysisTaskMockResult,
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

export function isMockResult(value: AnalysisTaskDto['result']): value is AnalysisTaskMockResult {
  return (
    !!value &&
    typeof value === 'object' &&
    'summary' in value &&
    'recommendations' in value &&
    Array.isArray((value as AnalysisTaskMockResult).recommendations)
  )
}

export function isMockTrace(value: AnalysisTaskDto['trace']): value is AnalysisTaskTrace {
  return (
    !!value &&
    typeof value === 'object' &&
    'mode' in value &&
    'steps' in value &&
    Array.isArray((value as AnalysisTaskTrace).steps)
  )
}
