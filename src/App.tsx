import { lazy, Suspense, useLayoutEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthGuard, GuestGuard } from '@/components/auth-guard'
import { ErrorBoundary } from '@/components/error-boundary'
import { AuthLayout } from '@/layouts/auth-layout'
import { MainLayout } from '@/layouts/main-layout'
import { NotFoundPage } from '@/pages/error/not-found'
import { globalLoading } from '@/store/loading.store'

const HomePage    = lazy(() => import('@/pages/home').then((m) => ({ default: m.HomePage })))
const LoginPage   = lazy(() => import('@/pages/login').then((m) => ({ default: m.LoginPage })))
const ReportsPage = lazy(() => import('@/pages/reports').then((m) => ({ default: m.ReportsPage })))
const UploadPage    = lazy(() => import('@/pages/upload').then((m) => ({ default: m.UploadPage })))
const SettingsPage         = lazy(() => import('@/pages/settings').then((m) => ({ default: m.SettingsPage })))
const LoanApplicationPage  = lazy(() => import('@/pages/loan-application').then((m) => ({ default: m.LoanApplicationPage })))

/** Hiện global loading khi Suspense đang chờ chunk tải */
function PageLoader() {
  useLayoutEffect(() => {
    globalLoading.show()
    return () => globalLoading.hide()
  }, [])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Unauthenticated */}
            <Route element={<GuestGuard />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>
            </Route>

            {/* Authenticated */}
            <Route element={<AuthGuard />}>
              <Route element={<MainLayout />}>
                <Route path="/"        element={<HomePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/upload"    element={<UploadPage />} />
                <Route path="/settings"          element={<SettingsPage />} />
                <Route path="/loan-application" element={<LoanApplicationPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
