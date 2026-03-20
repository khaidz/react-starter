import { lazy } from 'react'
import type { RouteConfig } from './types'

const LoginPage = lazy(() => import('@/pages/login').then((m) => ({ default: m.LoginPage })))

export const publicRoutes: RouteConfig[] = [
  {
    path: '/login',
    component: LoginPage,
  },
]
