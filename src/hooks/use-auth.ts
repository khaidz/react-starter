import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { accessToken, user, clearAuth } = useAuthStore()

  return {
    isLoggedIn: !!accessToken && !!user,
    user,
    clearAuth,
  }
}
