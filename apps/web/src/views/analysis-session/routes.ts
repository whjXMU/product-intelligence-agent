import type { AppRouteRecord } from '../../router/types.ts'

export default [
  {
    path: '/analysis-sessions',
    name: 'analysis-sessions',
    component: () => import('./index.vue'),
  },
  {
    path: '/analysis-sessions/:sessionId',
    name: 'analysis-session-detail',
    component: () => import('./index.vue'),
  },
] satisfies AppRouteRecord[]
