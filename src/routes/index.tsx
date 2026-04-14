import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { AuthGuard, GuestGuard } from '@/components/auth-guard'
import { PermissionGuard } from '@/components/permission-guard'
import { AuthLayout } from '@/layouts/auth-layout'
import { MainLayout } from '@/layouts/main-layout'
import { ForbiddenPage } from '@/pages/error/forbidden'
import { NotFoundPage } from '@/pages/error/not-found'
import { publicRoutes } from './public-routes'
import { privateRoutes } from './private-routes'

const AuthCallbackPage = lazy(() =>
  import('@/pages/auth-callback').then((m) => ({ default: m.AuthCallbackPage })),
)

export function AppRoutes() {
  return (
    <Routes>
      {/* Azure AD callback — nằm ngoài GuestGuard */}
      <Route
        path="/auth/callback"
        element={
          <Suspense fallback={null}>
            <AuthCallbackPage />
          </Suspense>
        }
      />

      {/* Public */}
      <Route element={<GuestGuard />}>
        <Route element={<AuthLayout />}>
          {publicRoutes.map(({ path, component: Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
        </Route>
      </Route>

      {/* Private */}
      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          {privateRoutes.map(({ path, component: Page, roles, permissions }) =>
            roles || permissions ? (
              <Route
                key={path}
                element={<PermissionGuard roles={roles} permissions={permissions} />}
              >
                <Route path={path} element={<Page />} />
              </Route>
            ) : (
              <Route key={path} path={path} element={<Page />} />
            ),
          )}
        </Route>
      </Route>

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
