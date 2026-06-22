import { ref } from 'vue'
import type { AnalysisTaskDto } from '@product-intelligence-agent/shared'
import {
  getAnalysisTask,
  runMockAnalysisTask,
} from '../api/analysisTasks.api'
import { formatUnknownError } from '../../../shared/utils/error'

export function useAnalysisTaskDetail() {
  const task = ref<AnalysisTaskDto | null>(null)
  const detailLoading = ref(false)
  const runningMock = ref(false)
  const detailErrorMessage = ref('')

  async function loadTask(id: string) {
    detailLoading.value = true
    detailErrorMessage.value = ''

    try {
      task.value = await getAnalysisTask(id)
    } catch (error) {
      detailErrorMessage.value = formatUnknownError(error, '加载任务详情失败')
      task.value = null
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

  return {
    task,
    detailLoading,
    runningMock,
    detailErrorMessage,
    loadTask,
    runMock,
  }
}
