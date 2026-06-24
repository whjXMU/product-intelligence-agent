import type {
  AddAnalysisSessionMessageRequest,
  AnalysisSessionDto,
  AnalysisSessionListItemDto,
  CreateAnalysisSessionRequest,
} from '@product-intelligence-agent/shared'
import { requestJson } from '../../../shared/api/http'

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
