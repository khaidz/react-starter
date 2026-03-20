import { del, get, post, put } from '@/lib/http'
import type { Department, PagedData, Role, UserItem } from '@/types/api'

export interface UserSearchParams {
  username?: string
  email?: string
  status?: string
  page?: number
  size?: number
  sort?: string[]
}

export interface CreateUserPayload {
  username: string
  password: string
  email: string
  status: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'DELETED'
  roleIds: number[]
  deptId?: number
}

export interface UpdateUserPayload {
  status?: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'DELETED'
  roleIds?: number[]
  deptId?: number
}

export const usersApi = {
  search: (params?: UserSearchParams) =>
    get<PagedData<UserItem>>('/api/v1/users/search', { params }),

  getById: (id: number) =>
    get<UserItem>(`/api/v1/users/${id}`),

  create: (payload: CreateUserPayload) =>
    post<UserItem>('/api/v1/users', payload),

  update: (id: number, payload: UpdateUserPayload) =>
    put<UserItem>(`/api/v1/users/${id}`, payload),

  delete: (id: number) =>
    del<void>(`/api/v1/users/${id}`),
}

export const rolesApi = {
  search: () => get<Role[]>('/api/v1/roles/search'),
}

export const departmentsApi = {
  search: (keyword?: string) =>
    get<Department[]>('/api/v1/departments/search', { params: { keyword, sort: 'name' } }),
}
