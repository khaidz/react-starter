import { lazy } from 'react'
import { Permissions, Roles } from '@/lib/permissions'
import type { RouteConfig } from './types'

const HomePage = lazy(() => import('@/pages/home').then((m) => ({ default: m.HomePage })))
const ReportsPage = lazy(() => import('@/pages/reports').then((m) => ({ default: m.ReportsPage })))
const UploadPage = lazy(() => import('@/pages/upload').then((m) => ({ default: m.UploadPage })))
const SettingsPage = lazy(() =>
  import('@/pages/settings').then((m) => ({ default: m.SettingsPage })),
)
const LoanApplicationPage = lazy(() =>
  import('@/pages/loan-application').then((m) => ({ default: m.LoanApplicationPage })),
)
const UsersPage = lazy(() => import('@/pages/users').then((m) => ({ default: m.UsersPage })))

export const privateRoutes: RouteConfig[] = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/reports',
    component: ReportsPage,
    roles: [Roles.ADMIN],
    permissions: [Permissions.REPORTS_VIEW],
  },
  {
    path: '/upload',
    component: UploadPage,
    roles: [Roles.ADMIN],
    permissions: [Permissions.UPLOAD_CREATE],
  },
  {
    path: '/settings',
    component: SettingsPage,
    roles: [Roles.ADMIN],
    permissions: [Permissions.SETTINGS_VIEW],
  },
  {
    path: '/loan-application',
    component: LoanApplicationPage,
    roles: [Roles.ADMIN],
    permissions: [Permissions.LOAN_APPLICATION_VIEW],
  },
  {
    path: '/users',
    component: UsersPage,
    roles: [Roles.ADMIN],
    permissions: [Permissions.USERS_VIEW],
  },
]
