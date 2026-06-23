import { ref } from 'vue'
import type {
  AnalysisTaskDto,
  AnalysisTaskRunListItemDto,
} from '@product-intelligence-agent/shared'
import {
  getAnalysisTask,
  listAnalysisTaskRuns,
  runAnalysisAgent,
  runMockAnalysisTask,
} from '../api/analysisTasks.api'
import { formatUnknownError } from '../../../shared/utils/error'

export function useAnalysisTaskDetail() {
  const task = ref<AnalysisTaskDto | null>(null)
  const latestRun = ref<AnalysisTaskRunListItemDto | null>(null)
  const detailLoading = ref(false)
  const runningMock = ref(false)
  const runningAgent = ref(false)
  const detailErrorMessage = ref('')

  async function loadTask(id: string) {
    detailLoading.value = true
    detailErrorMessage.value = ''

    try {
      task.value = await getAnalysisTask(id)
      try {
        const runs = await listAnalysisTaskRuns(id)
        latestRun.value = runs[0] ?? null
      } catch {
        latestRun.value = null
      }
    } catch (error) {
      detailErrorMessage.value = formatUnknownError(error, '加载任务详情失败')
      task.value = null
      latestRun.value = null
    } finally {
      detailLoading.value = false
    }
  }

  async function runMock() {
    if (!task.value) return

    runningMock.value = true
    detailErrorMessage.value = ''

    try {
      task.value = await runMockAnalysisTask(task.value.id)
    } catch (error) {
      detailErrorMessage.value = formatUnknownError(error, '生成 mock 报告失败')
    } finally {
      runningMock.value = false
    }
  }

  async function runAgent() {
    if (!task.value) return

    const taskId = task.value.id
    runningAgent.value = true
    detailErrorMessage.value = ''

    try {
      const run = await runAnalysisAgent(taskId)
      latestRun.value = run
      task.value = await getAnalysisTask(taskId)
    } catch (error) {
      detailErrorMessage.value = formatUnknownError(error, '运行 Agent 分析失败')
    } finally {
      runningAgent.value = false
    }
  }

  return {
    task,
    latestRun,
    detailLoading,
    runningMock,
    runningAgent,
    detailErrorMessage,
    loadTask,
    runMock,
    runAgent,
  }
}
