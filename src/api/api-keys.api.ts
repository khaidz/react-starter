import { del, get, patch, post, put } from '@/lib/http'
import type { ApiKeyItem } from '@/types/api'

export interface CreateApiKeyPayload {
  name: string
  description?: string
  expiresAt?: string | null
}

export interface UpdateApiKeyPayload {
  name: string
  description?: string
  expiresAt?: string | null
}

export const apiKeysApi = {
  getAll: () =>
    get<ApiKeyItem[]>('/api/v1/api-keys'),

  getById: (id: number) =>
    get<ApiKeyItem>(`/api/v1/api-keys/${id}`),

  create: (payload: CreateApiKeyPayload) =>
    post<ApiKeyItem>('/api/v1/api-keys', payload),

  update: (id: number, payload: UpdateApiKeyPayload) =>
    put<ApiKeyItem>(`/api/v1/api-keys/${id}`, payload),

  revoke: (id: number) =>
    patch<void>(`/api/v1/api-keys/${id}/revoke`),

  delete: (id: number) =>
    del<void>(`/api/v1/api-keys/${id}`),
}
