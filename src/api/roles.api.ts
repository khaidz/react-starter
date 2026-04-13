import { del, get, post, put } from '@/lib/http'
import type { RoleItem } from '@/types/api'

export interface RoleSearchParams {
  name?: string
}

export interface CreateRolePayload {
  name: string
  description?: string
  permissionIds: number[]
}

export interface UpdateRolePayload {
  name: string
  description?: string
  permissionIds: number[]
}

export const rolesApi = {
  search: (params?: RoleSearchParams) =>
    get<RoleItem[]>('/api/v1/roles/search', { params }),

  getById: (id: number) =>
    get<RoleItem>(`/api/v1/roles/${id}`),

  create: (payload: CreateRolePayload) =>
    post<void>('/api/v1/roles', payload),

  update: (id: number, payload: UpdateRolePayload) =>
    put<void>(`/api/v1/roles/${id}`, payload),

  delete: (id: number) =>
    del<void>(`/api/v1/roles/${id}`),
}
