import { get, post, put, del } from '@/lib/http'
import type { LeaveTypeItem, PagedData } from '@/types/api'

export interface CreateLeaveTypePayload {
  name: string
  description?: string
  maxDaysPerYear: number
  isPaid: boolean
  isActive: boolean
}

export const leaveTypesApi = {
  listActive: () => get<LeaveTypeItem[]>('/api/v1/leave-types'),

  search: ({ name, page, size, sort }: { name?: string; page?: number; size?: number; sort?: string } = {}) =>
    post<PagedData<LeaveTypeItem>>('/api/v1/leave-types/search', { name }, {
      params: { page, size, sort },
    }),

  getById: (id: string) => get<LeaveTypeItem>(`/api/v1/leave-types/${id}`),

  create: (payload: CreateLeaveTypePayload) => post<LeaveTypeItem>('/api/v1/leave-types', payload),

  update: (id: string, payload: CreateLeaveTypePayload) =>
    put<LeaveTypeItem>(`/api/v1/leave-types/${id}`, payload),

  delete: (id: string) => del<void>(`/api/v1/leave-types/${id}`),
}
