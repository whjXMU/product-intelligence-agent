import type { RouteRecordRaw } from 'vue-router'
import { viewRoutes } from './routeModules'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/analysis-tasks',
  },
  ...viewRoutes,
]
