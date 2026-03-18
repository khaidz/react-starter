import { del, get, post, put } from '@/lib/http'
import type { PagedData, RoleItem } from '@/types/api'

export interface RoleSearchParams {
  name?: string
}

export interface RolePagedSearchParams {
  name?: string
  page?: number
  size?: number
  sort?: string[]
}

export interface CreateRolePayload {
  name: string
  description?: string
  permissionIds: string[]
}

export interface UpdateRolePayload {
  name: string
  description?: string
  permissionIds: string[]
}

export const rolesApi = {
  getAll: () =>
    get<RoleItem[]>('/api/v1/roles'),

  searchPaged: ({ name, page, size, sort }: RolePagedSearchParams = {}) =>
    post<PagedData<RoleItem>>('/api/v1/roles/search', { name }, { params: { page, size, sort } }),

  getById: (id: string) =>
    get<RoleItem>(`/api/v1/roles/${id}`),

  create: (payload: CreateRolePayload) =>
    post<void>('/api/v1/roles', payload),

  update: (id: string, payload: UpdateRolePayload) =>
    put<void>(`/api/v1/roles/${id}`, payload),

  delete: (id: string) =>
    del<void>(`/api/v1/roles/${id}`),
}
