import { get, patch, post } from '@/lib/http'
import type { JobItem, JobLogItem, PagedData } from '@/types/api'

export const jobsApi = {
  list: () =>
    get<JobItem[]>('/api/v1/jobs'),

  trigger: (name: string) =>
    post<void>(`/api/v1/jobs/${encodeURIComponent(name)}/trigger`),

  toggle: (name: string) =>
    patch<void>(`/api/v1/jobs/${encodeURIComponent(name)}/toggle`),

  getLogs: (name: string, page = 0, size = 20) =>
    get<PagedData<JobLogItem>>(`/api/v1/jobs/${encodeURIComponent(name)}/logs`, {
      params: { page, size },
    }),

  updateCron: (name: string, cron: string) =>
    patch<void>(`/api/v1/jobs/${encodeURIComponent(name)}/schedule`, { cron }),
}
