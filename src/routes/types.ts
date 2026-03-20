import type { ComponentType, LazyExoticComponent } from 'react'

export interface RouteConfig {
  path: string
  component: LazyExoticComponent<ComponentType> | ComponentType
  roles?: string[]
  permissions?: string[]
}
