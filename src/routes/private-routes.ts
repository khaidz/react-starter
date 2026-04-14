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
const PermissionPage = lazy(() =>
  import('@/pages/permission').then((m) => ({ default: m.PermissionPage })),
)
const RolePage = lazy(() =>
  import('@/pages/role').then((m) => ({ default: m.RolePage })),
)
const DepartmentPage = lazy(() =>
  import('@/pages/department').then((m) => ({ default: m.DepartmentPage })),
)
const UserPage = lazy(() =>
  import('@/pages/user').then((m) => ({ default: m.UserPage })),
)
const ApiKeyPage = lazy(() =>
  import('@/pages/api-key').then((m) => ({ default: m.ApiKeyPage })),
)
const NotificationAdminPage = lazy(() =>
  import('@/pages/notification').then((m) => ({ default: m.NotificationAdminPage })),
)
const CsvMergerPage = lazy(() =>
  import('@/pages/csv-merger').then((m) => ({ default: m.CsvMergerPage })),
)
const JsonToExcelPage = lazy(() =>
  import('@/pages/json-to-excel').then((m) => ({ default: m.JsonToExcelPage })),
)
const ExcelViewerPage = lazy(() =>
  import('@/pages/excel-viewer').then((m) => ({ default: m.ExcelViewerPage })),
)
const CodeConverterPage = lazy(() =>
  import('@/pages/code-converter').then((m) => ({ default: m.CodeConverterPage })),
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
  {
    path: '/permissions',
    component: PermissionPage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/roles',
    component: RolePage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/departments',
    component: DepartmentPage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/users',
    component: UserPage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/api-keys',
    component: ApiKeyPage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/notifications/admin',
    component: NotificationAdminPage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/tools/csv-merger',
    component: CsvMergerPage,
  },
  {
    path: '/tools/json-to-excel',
    component: JsonToExcelPage,
  },
  {
    path: '/tools/excel-viewer',
    component: ExcelViewerPage,
  },
  {
    path: '/tools/code-converter',
    component: CodeConverterPage,
  },
]
