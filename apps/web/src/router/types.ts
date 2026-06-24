import type { RouteRecordRaw } from 'vue-router'

export type AppRouteRecord = Omit<RouteRecordRaw, 'children'> & {
  disabled?: boolean
  children?: AppRouteRecord[]
}
