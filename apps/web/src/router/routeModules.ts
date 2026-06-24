import type { RouteRecordRaw } from 'vue-router'
import type { AppRouteRecord } from './types'

const routeModules = import.meta.glob<AppRouteRecord[]>('../views/**/routes.ts', {
  eager: true,
  import: 'default',
})

export const viewRoutes = Object.values(routeModules).flatMap((routes) =>
  normalizeRoutes(routes),
)

function normalizeRoutes(routes: AppRouteRecord[]): RouteRecordRaw[] {
  return routes
    .filter((route) => !route.disabled)
    .map(({ disabled: _disabled, children, ...route }) => ({
      ...route,
      ...(children ? { children: normalizeRoutes(children) } : {}),
    })) as RouteRecordRaw[]
}
