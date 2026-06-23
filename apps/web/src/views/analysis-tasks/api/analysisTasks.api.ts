import type {
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared'
import { requestJson } from '../../../shared/api/http'

export function listAnalysisTasks() {
  return requestJson<AnalysisTaskListItemDto[]>('/analysis-tasks')
}

export function getAnalysisTask(id: string) {
  return requestJson<AnalysisTaskDto>(`/analysis-tasks/${id}`)
}

export function createAnalysisTask(request: CreateAnalysisTaskRequest) {
  return requestJson<AnalysisTaskDto>('/analysis-tasks', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function runMockAnalysisTask(id: string) {
  return requestJson<AnalysisTaskDto>(`/analysis-tasks/${id}/run-mock`, {
    method: 'POST',
  })
}

export function runWorkflowAnalysisTask(id: string) {
  return requestJson<AnalysisTaskDto>(`/analysis-tasks/${id}/run-workflow`, {
    method: 'POST',
  })
}
