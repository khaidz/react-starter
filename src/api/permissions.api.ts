import { del, get, post, put } from '@/lib/http'
import type { PermissionItem } from '@/types/api'

export interface PermissionSearchParams {
  name?: string
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
  search: (params?: PermissionSearchParams) =>
    get<PermissionItem[]>('/api/v1/permissions/search', { params }),

  getById: (id: number) =>
    get<PermissionItem>(`/api/v1/permissions/${id}`),

  create: (payload: CreatePermissionPayload) =>
    post<void>('/api/v1/permissions', payload),

  update: (id: number, payload: UpdatePermissionPayload) =>
    put<void>(`/api/v1/permissions/${id}`, payload),

  delete: (id: number) =>
    del<void>(`/api/v1/permissions/${id}`),
}
