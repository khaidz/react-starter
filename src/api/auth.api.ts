import { get, post } from '@/lib/http'
import type { AuthData, User } from '@/types/api'

export interface LoginPayload {
  username: string
  password: string
  rememberMe?: boolean
}

export const authApi = {
  login: (payload: LoginPayload) => post<AuthData>('/api/v1/auth/login', payload),
  logout: () => post('/api/v1/auth/logout'),
  getProfile: () => get<User>('/api/v1/users/profile'),
}
