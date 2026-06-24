import type {
  AnalysisSessionDto,
  AnalysisSessionMessage,
} from '@product-intelligence-agent/shared'
import { formatDateTime } from '../../../shared/utils/date'

export function formatSessionDate(value: string) {
  return formatDateTime(value)
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

export function getSessionMessageRoleText(role: AnalysisSessionMessage['role']) {
  const roleMap: Record<AnalysisSessionMessage['role'], string> = {
    user: '你',
    assistant: 'Agent',
    system: '系统',
  }

  return roleMap[role]
}
