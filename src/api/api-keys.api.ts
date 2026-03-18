import { del, get, patch, post, put } from '@/lib/http'
import type { ApiKeyItem, PagedData } from '@/types/api'

export interface ApiKeySearchParams {
  name?: string
  page?: number
  size?: number
  sort?: string[]
}

export interface CreateApiKeyPayload {
  name: string
  description?: string
  expiresAt?: string | null
  permissionIds?: string[]
}

export interface UpdateApiKeyPayload {
  name: string
  description?: string
  expiresAt?: string | null
  permissionIds?: string[]
}

export const apiKeysApi = {
  getAll: () =>
    get<ApiKeyItem[]>('/api/v1/api-keys'),

  search: ({ name, page, size, sort }: ApiKeySearchParams = {}) =>
    post<PagedData<ApiKeyItem>>('/api/v1/api-keys/search', { name }, { params: { page, size, sort } }),

  getById: (id: string) =>
    get<ApiKeyItem>(`/api/v1/api-keys/${id}`),

  create: (payload: CreateApiKeyPayload) =>
    post<ApiKeyItem>('/api/v1/api-keys', payload),

  update: (id: string, payload: UpdateApiKeyPayload) =>
    put<ApiKeyItem>(`/api/v1/api-keys/${id}`, payload),

  revoke: (id: string) =>
    patch<void>(`/api/v1/api-keys/${id}/revoke`),

  delete: (id: string) =>
    del<void>(`/api/v1/api-keys/${id}`),
}
