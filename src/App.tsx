import { Suspense, useLayoutEffect } from 'react'
import { BrowserRouter } from 'react-router'
import { ErrorBoundary } from '@/components/error-boundary'
import { AppRoutes } from '@/routes'
import { globalLoading } from '@/store/loading.store'

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
          <AppRoutes />
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
