import { get, post, put } from '@/lib/http'
import type { LeaveBalanceItem, PagedData } from '@/types/api'

export const leaveBalancesApi = {
  getMyBalances: () => get<LeaveBalanceItem[]>('/api/v1/leave-balances/me'),

  getUserBalances: (userId: string) => get<LeaveBalanceItem[]>(`/api/v1/leave-balances/user/${userId}`),

  search: ({
    username,
    leaveTypeId,
    year,
    page,
    size,
    sort,
  }: {
    username?: string
    leaveTypeId?: string
    year?: number
    page?: number
    size?: number
    sort?: string
  } = {}) =>
    post<PagedData<LeaveBalanceItem>>('/api/v1/leave-balances/search', { username, leaveTypeId, year }, {
      params: { page, size, sort },
    }),

  update: (id: string, totalDays: number) =>
    put<LeaveBalanceItem>(`/api/v1/leave-balances/${id}`, { totalDays }),

  initYear: (year: number) => post<void>('/api/v1/leave-balances/init-year', undefined, { params: { year } }),
}
