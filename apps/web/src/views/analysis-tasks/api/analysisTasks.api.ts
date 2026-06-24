import type {
  AddAnalysisSessionMessageRequest,
  AnalysisSessionDto,
  AnalysisSessionListItemDto,
  AnalysisTaskDto,
  AnalysisTaskListItemDto,
  AnalysisTaskRunDto,
  AnalysisTaskRunListItemDto,
  CreateAnalysisSessionRequest,
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

export function runAnalysisAgent(id: string) {
  return createAnalysisTaskRun(id)
}

export function createAnalysisTaskRun(id: string) {
  return requestJson<AnalysisTaskRunDto>(`/analysis-tasks/${id}/runs`, {
    method: 'POST',
  })
}

export function getAnalysisTaskRun(taskId: string, runId: string) {
  return requestJson<AnalysisTaskRunDto>(`/analysis-tasks/${taskId}/runs/${runId}`)
}

export function listAnalysisTaskRuns(taskId: string) {
  return requestJson<AnalysisTaskRunListItemDto[]>(`/analysis-tasks/${taskId}/runs`)
}

export function createAnalysisSession(request: CreateAnalysisSessionRequest) {
  return requestJson<AnalysisSessionDto>('/analysis-sessions', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function listAnalysisSessions() {
  return requestJson<AnalysisSessionListItemDto[]>('/analysis-sessions')
}

export function getAnalysisSession(id: string) {
  return requestJson<AnalysisSessionDto>(`/analysis-sessions/${id}`)
}

export function addAnalysisSessionMessage(
  id: string,
  request: AddAnalysisSessionMessageRequest,
) {
  return requestJson<AnalysisSessionDto>(`/analysis-sessions/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function runAnalysisSession(id: string) {
  return requestJson<AnalysisSessionDto>(`/analysis-sessions/${id}/run`, {
    method: 'POST',
  })
}

export function deleteAnalysisSession(id: string) {
  return requestJson<null>(`/analysis-sessions/${id}`, {
    method: 'DELETE',
  })
}
