import { del, get, post, put } from '@/lib/http'
import type { PagedData, UserItem, UserStatus } from '@/types/api'

export interface UserSearchParams {
  username?: string
  email?: string
  status?: UserStatus[]
  role?: string[]
  deptId?: string[]
  page?: number
  size?: number
  sort?: string[]
}

export interface CreateUserPayload {
  username: string
  password: string
  email: string
  status?: UserStatus
  roleIds: string[]
  deptId?: string | null
  isDepartmentOwner?: boolean
}

export interface UpdateUserPayload {
  username?: string
  email?: string
  status?: UserStatus
  roleIds: string[]
  deptId?: string | null
  isDepartmentOwner?: boolean
}

export const usersApi = {
  search: ({ username, email, status, role, deptId, page, size, sort }: UserSearchParams = {}) =>
    post<PagedData<UserItem>>('/api/v1/users/search', { username, email, statuses: status, roles: role, deptIds: deptId }, { params: { page, size, sort } }),

  getById: (id: string) =>
    get<UserItem>(`/api/v1/users/${id}`),

  create: (payload: CreateUserPayload) =>
    post<void>('/api/v1/users', payload),

  update: (id: string, payload: UpdateUserPayload) =>
    put<void>(`/api/v1/users/${id}`, payload),

  delete: (id: string) =>
    del<void>(`/api/v1/users/${id}`),
}
