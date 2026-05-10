import { lazy } from 'react'
import type { RouteConfig } from './types'
import { Roles } from '@/lib/permissions'

const HomePage = lazy(() => import('@/pages/home').then((m) => ({ default: m.HomePage })))
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
const JobPage = lazy(() =>
  import('@/pages/job').then((m) => ({ default: m.JobPage })),
)
const LeaveTypePage = lazy(() =>
  import('@/pages/leave/leave-types').then((m) => ({ default: m.LeaveTypePage })),
)
const LeaveRequestPage = lazy(() =>
  import('@/pages/leave/leave-requests').then((m) => ({ default: m.LeaveRequestPage })),
)
const LeaveBalancePage = lazy(() =>
  import('@/pages/leave/leave-balances').then((m) => ({ default: m.LeaveBalancePage })),
)

export const privateRoutes: RouteConfig[] = [
  {
    path: '/',
    component: HomePage,
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
    path: '/jobs',
    component: JobPage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/leave/requests',
    component: LeaveRequestPage,
  },
  {
    path: '/leave/types',
    component: LeaveTypePage,
    roles: [Roles.ADMIN],
  },
  {
    path: '/leave/balances',
    component: LeaveBalancePage,
    roles: [Roles.ADMIN],
  },
]
