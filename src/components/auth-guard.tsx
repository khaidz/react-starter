import { useEffect, useLayoutEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router'
import { authApi } from '@/api/auth.api'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth.store'
import { globalLoading } from '@/store/loading.store'

export function AuthGuard() {
  const { isLoggedIn, clearAuth } = useAuth()
  const setUser = useAuthStore((s) => s.setUser)
  const location = useLocation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  // Cập nhật user mới nhất vào store
  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  // Token hết hạn và refresh cũng thất bại → xóa auth
  useEffect(() => {
    if (isError) clearAuth()
  }, [isError, clearAuth])

  // Hiện global loading lần đầu fetch profile
  useLayoutEffect(() => {
    if (isLoading) {
      globalLoading.show()
      return () => globalLoading.hide()
    }
  }, [isLoading])

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Chặn render cho đến khi profile được fetch xong lần đầu
  if (isLoading) return null

  return <Outlet />
}

// Ngăn user đã login vào lại trang login/register
export function GuestGuard() {
  const { isLoggedIn } = useAuth()

  if (isLoggedIn) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
