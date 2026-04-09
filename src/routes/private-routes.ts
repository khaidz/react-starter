import { lazy } from 'react'
import type { RouteConfig } from './types'
import { Roles } from '@/lib/permissions'

const HomePage = lazy(() => import('@/pages/home').then((m) => ({ default: m.HomePage })))
const WorkflowConfigPage = lazy(() =>
  import('@/pages/workflow-config').then((m) => ({ default: m.WorkflowConfigPage })),
)
const WorkflowRunnerPage = lazy(() =>
  import('@/pages/workflow-runner').then((m) => ({ default: m.WorkflowRunnerPage })),
)

export const privateRoutes: RouteConfig[] = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/workflow-config',
    component: WorkflowConfigPage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/workflow-runner',
    component: WorkflowRunnerPage,
  },
]
