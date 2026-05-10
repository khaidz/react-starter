import { get, post, del } from '@/lib/http'
import type { LeaveRequestItem, LeaveRequestStatus, PagedData } from '@/types/api'

export interface CreateLeaveRequestPayload {
  leaveTypeId: string
  startDate: string
  endDate: string
  reason?: string
}

export interface SearchLeaveRequestPayload {
  requesterUsername?: string
  leaveTypeId?: string
  statuses?: LeaveRequestStatus[]
  fromDate?: string
  toDate?: string
  myRequestsOnly?: boolean
}

export const leaveRequestsApi = {
  search: (
    body: SearchLeaveRequestPayload = {},
    { page, size, sort }: { page?: number; size?: number; sort?: string } = {},
  ) =>
    post<PagedData<LeaveRequestItem>>('/api/v1/leave-requests/search', body, {
      params: { page, size, sort },
    }),

  create: (payload: CreateLeaveRequestPayload) =>
    post<LeaveRequestItem>('/api/v1/leave-requests', payload),

  getById: (id: string) => get<LeaveRequestItem>(`/api/v1/leave-requests/${id}`),

  cancel: (id: string) => del<void>(`/api/v1/leave-requests/${id}`),

  approve: (id: string, approverComment?: string) =>
    post<LeaveRequestItem>(`/api/v1/leave-requests/${id}/approve`, { approverComment }),

  reject: (id: string, approverComment?: string) =>
    post<LeaveRequestItem>(`/api/v1/leave-requests/${id}/reject`, { approverComment }),
}
