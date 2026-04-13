import { del, get, post } from '@/lib/http'
import type { PagedData } from '@/types/api'

export type NotificationType = 'SYSTEM' | 'COMMENT'

export interface NotificationItem {
  id: number
  type: string
  title: string
  body: string
  targetUrl?: string
  read: boolean
  createdAt: string
  unreadCount: number
}

export interface UnreadCount {
  unreadCount: number
}

export interface NotificationSearchParams {
  type?: string
  isRead?: boolean
  page?: number
  size?: number
}

export interface SendToUserPayload {
  recipient: string
  type?: string
  title: string
  body?: string
  targetUrl?: string
}

export interface SendToUsersPayload {
  recipients: string[]
  notification: SendToUserPayload
}

export interface BroadcastPayload {
  type?: string
  title: string
  body?: string
  targetUrl?: string
}

export const notificationsApi = {
  list: (params?: NotificationSearchParams) =>
    get<PagedData<NotificationItem>>('/api/v1/notifications', { params }),

  getById: (id: number) =>
    get<NotificationItem>(`/api/v1/notifications/${id}`),

  unreadCount: () =>
    get<UnreadCount>('/api/v1/notifications/unread-count'),

  markAsRead: (id: number) =>
    post<void>(`/api/v1/notifications/${id}/read`, {}),

  markAllAsRead: () =>
    post<void>('/api/v1/notifications/read-all', {}),

  delete: (id: number) =>
    del<void>(`/api/v1/notifications/${id}`),

  deleteAll: () =>
    del<void>('/api/v1/notifications'),

  // Admin only
  sendToUser: (payload: SendToUserPayload) =>
    post<NotificationItem>('/api/v1/notifications/send', payload),

  sendToUsers: (payload: SendToUsersPayload) =>
    post<void>('/api/v1/notifications/send-to-users', payload),

  broadcast: (payload: BroadcastPayload) =>
    post<void>('/api/v1/notifications/broadcast', payload),
}
