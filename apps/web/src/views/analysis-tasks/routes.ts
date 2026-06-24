import type { AppRouteRecord } from '../../app/router/types'

export default [
  {
    path: '/analysis-tasks',
    name: 'analysis-tasks',
    component: () => import('./WorkspaceView.vue'),
  },
  {
    path: '/analysis-tasks/:id',
    name: 'analysis-task-detail',
    component: () => import('./DetailView.vue'),
  },
] satisfies AppRouteRecord[]
