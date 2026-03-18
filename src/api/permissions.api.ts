import { del, get, post, put } from '@/lib/http'
import type { PagedData, PermissionItem } from '@/types/api'

export interface PermissionSearchParams {
  name?: string
  page?: number
  size?: number
  sort?: string[]
}


export interface CreatePermissionPayload {
  name: string
  description?: string
}

export interface UpdatePermissionPayload {
  name: string
  description?: string
}

export const permissionsApi = {
  search: ({ name }: PermissionSearchParams = {}) =>
    post<PagedData<PermissionItem>>('/api/v1/permissions/search', { name }, { params: { size: 1000 } }).then((r) => r.content),

  searchPaged: ({ name, page, size, sort }: PermissionSearchParams = {}) =>
    post<PagedData<PermissionItem>>('/api/v1/permissions/search', { name }, { params: { page, size, sort } }),

  getById: (id: string) =>
    get<PermissionItem>(`/api/v1/permissions/${id}`),

  create: (payload: CreatePermissionPayload) =>
    post<void>('/api/v1/permissions', payload),

  update: (id: string, payload: UpdatePermissionPayload) =>
    put<void>(`/api/v1/permissions/${id}`, payload),

  delete: (id: string) =>
    del<void>(`/api/v1/permissions/${id}`),
}
