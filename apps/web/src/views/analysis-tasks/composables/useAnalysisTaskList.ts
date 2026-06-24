import { ref } from 'vue'
import type {
  AnalysisTaskListItemDto,
  CreateAnalysisTaskRequest,
} from '@product-intelligence-agent/shared'
import {
  createAnalysisTask,
  listAnalysisTasks,
} from '../api/analysisTasks.api'
import { ApiError } from '../../../shared/api/http'
import { formatUnknownError } from '../../../shared/utils/error'

export function useAnalysisTaskList() {
  const tasks = ref<AnalysisTaskListItemDto[]>([])
  const tasksLoading = ref(false)
  const creating = ref(false)
  const taskErrorMessage = ref('')
  const taskError = ref<ApiError | null>(null)

  async function loadTasks() {
    tasksLoading.value = true
    taskErrorMessage.value = ''
    taskError.value = null

    try {
      tasks.value = await listAnalysisTasks()
    } catch (error) {
      taskErrorMessage.value = formatUnknownError(error, '加载任务列表失败')
      taskError.value = error instanceof ApiError ? error : null
    } finally {
      tasksLoading.value = false
    }
  }

  async function submitTask(request: CreateAnalysisTaskRequest) {
    creating.value = true
    taskErrorMessage.value = ''
    taskError.value = null

    try {
      const task = await createAnalysisTask(request)
      await loadTasks()
      return task
    } catch (error) {
      taskErrorMessage.value = formatUnknownError(error, '创建任务失败')
      taskError.value = error instanceof ApiError ? error : null
      return null
    } finally {
      creating.value = false
    }
  }

  return {
    tasks,
    tasksLoading,
    creating,
    taskErrorMessage,
    taskError,
    loadTasks,
    submitTask,
  }
}
