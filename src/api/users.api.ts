import { del, get, post, put } from '@/lib/http'
import type { PagedData, UserItem, UserStatus } from '@/types/api'

export interface UserSearchParams {
  username?: string
  email?: string
  status?: UserStatus
  page?: number
  size?: number
}

export interface CreateUserPayload {
  username: string
  password: string
  email: string
  status?: UserStatus
  roleIds: number[]
  deptId?: number | null
  isDepartmentOwner?: boolean
}

export interface UpdateUserPayload {
  username?: string
  email?: string
  status?: UserStatus
  roleIds: number[]
  deptId?: number | null
  isDepartmentOwner?: boolean
}

export const usersApi = {
  search: (params?: UserSearchParams) =>
    get<PagedData<UserItem>>('/api/v1/users/search', { params }),

  getById: (id: number) =>
    get<UserItem>(`/api/v1/users/${id}`),

  create: (payload: CreateUserPayload) =>
    post<void>('/api/v1/users', payload),

  update: (id: number, payload: UpdateUserPayload) =>
    put<void>(`/api/v1/users/${id}`, payload),

  delete: (id: number) =>
    del<void>(`/api/v1/users/${id}`),
}
