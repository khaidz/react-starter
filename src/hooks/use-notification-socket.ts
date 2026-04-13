import { useAuthStore } from '@/store/auth.store'
import { Client } from '@stomp/stompjs'
import { useEffect, useRef } from 'react'
import SockJS from 'sockjs-client'

export interface WsNotification {
  id?: number
  type?: string
  title: string
  body?: string
  targetUrl?: string
  isRead?: boolean
  createdAt?: string
  unreadCount?: number
}

export interface WsBadge {
  unreadCount: number
}

interface Options {
  onNotification?: (msg: WsNotification) => void
  onBadge?: (msg: WsBadge) => void
}

const WS_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/ws`

export function useNotificationSocket({ onNotification, onBadge }: Options = {}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // Nhận notification mới
        client.subscribe('/user/queue/notifications', (frame) => {
          try {
            const msg: WsNotification = JSON.parse(frame.body)
            onNotification?.(msg)
          } catch {}
        })

        // Nhận badge count update
        client.subscribe('/user/queue/notifications/badge', (frame) => {
          try {
            const msg: WsBadge = JSON.parse(frame.body)
            onBadge?.(msg)
          } catch {}
        })

        // Broadcast toàn hệ thống
        client.subscribe('/topic/notifications', (frame) => {
          try {
            const msg: WsNotification = JSON.parse(frame.body)
            onNotification?.(msg)
          } catch {}
        })
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])
}
