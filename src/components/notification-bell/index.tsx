import { notificationsApi } from '@/api/notifications.api'
import type { NotificationItem } from '@/api/notifications.api'
import { notifyError } from '@/lib/notify'
import { modals } from '@mantine/modals'
import {
  ActionIcon,
  Badge,
  Box,
  Divider,
  Group,
  Indicator,
  Loader,
  Popover,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconBell, IconCheck, IconTrash } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useNotificationSocket } from '@/hooks/use-notification-socket'
import { notifications as mantineNotifications } from '@mantine/notifications'
import styles from './notification-bell.module.scss'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationRow({
  item,
  onRead,
  onDelete,
}: {
  item: NotificationItem
  onRead: (id: number) => void
  onDelete: (id: number) => void
}) {
  const navigate = useNavigate()

  function handleClick() {
    if (!item.read) onRead(item.id)
    if (item.targetUrl) navigate(item.targetUrl)
  }

  return (
    <UnstyledButton
      className={`${styles.row} ${item.read ? styles.read : styles.unread}`}
      onClick={handleClick}
    >
      <div className={styles.rowContent}>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
          <Text size="sm" fw={item.read ? 400 : 600} lineClamp={1}>
            {item.title}
          </Text>
          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
            {timeAgo(item.createdAt)}
          </Text>
        </Group>
        {item.body && (
          <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
            {item.body}
          </Text>
        )}
      </div>
      <Group gap={4} className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
        {!item.read && (
          <Tooltip label="Mark as read" withArrow>
            <ActionIcon size="xs" variant="subtle" color="blue" onClick={() => onRead(item.id)}>
              <IconCheck size={12} />
            </ActionIcon>
          </Tooltip>
        )}
        <Tooltip label="Delete" withArrow>
          <ActionIcon size="xs" variant="subtle" color="red" onClick={() => onDelete(item.id)}>
            <IconTrash size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </UnstyledButton>
  )
}

export function NotificationBell() {
  const [opened, { toggle, close }] = useDisclosure(false)
  const queryClient = useQueryClient()

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationsApi.list({ size: 20 }),
    enabled: opened,
  })

  const unreadCount = unreadData?.unreadCount ?? 0
  const items = data?.content ?? []

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
  }

  // WebSocket — nhận notification realtime
  useNotificationSocket({
    onNotification: (msg) => {
      // Cập nhật unread count từ payload nếu có, không thì invalidate
      if (msg.unreadCount !== undefined) {
        queryClient.setQueryData(['notifications-unread'], { unreadCount: msg.unreadCount })
      } else {
        queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      }
      // Reload list nếu popover đang mở
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
      // Toast
      if (msg.title) {
        mantineNotifications.show({
          title: msg.title,
          message: msg.body ?? '',
          color: 'blue',
          autoClose: 5000,
        })
      }
    },
    onBadge: (msg) => {
      queryClient.setQueryData(['notifications-unread'], { unreadCount: msg.unreadCount })
    },
  })

  const markAsRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e),
  })

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: invalidate,
    onError: (e) => notifyError(e),
  })

  const deleteOne = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e),
  })

  const deleteAll = useMutation({
    mutationFn: () => notificationsApi.deleteAll(),
    onSuccess: invalidate,
    onError: (e) => notifyError(e),
  })

  function confirmDeleteOne(id: number) {
    modals.openConfirmModal({
      title: 'Delete notification',
      children: <Text size="sm">Are you sure you want to delete this notification?</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteOne.mutate(id),
    })
  }

  function confirmDeleteAll() {
    modals.openConfirmModal({
      title: 'Delete all notifications',
      children: <Text size="sm">Are you sure you want to delete all notifications? This cannot be undone.</Text>,
      labels: { confirm: 'Delete all', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteAll.mutate(undefined),
    })
  }

  return (
    <Popover opened={opened} onClose={close} width={360} position="bottom-end" shadow="md" withinPortal>
      <Popover.Target>
        <Indicator
          label={unreadCount > 99 ? '99+' : String(unreadCount)}
          size={16}
          disabled={unreadCount === 0}
          color="red"
          offset={4}
        >
          <ActionIcon variant="subtle" color="gray" size="lg" radius="xl" onClick={toggle}>
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        {/* Header */}
        <Group justify="space-between" align="center" px="sm" py="xs" className={styles.header}>
          <Group gap={6}>
            <Text fw={600} size="sm">Notifications</Text>
            {unreadCount > 0 && (
              <Badge size="xs" color="red" variant="filled">{unreadCount}</Badge>
            )}
          </Group>
          <Group gap={4}>
            {unreadCount > 0 && (
              <Tooltip label="Mark all as read" withArrow>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="blue"
                  loading={markAllAsRead.isPending}
                  onClick={() => markAllAsRead.mutate(undefined)}
                >
                  <IconCheck size={13} />
                </ActionIcon>
              </Tooltip>
            )}
            {items.length > 0 && (
              <Tooltip label="Delete all" withArrow>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="red"
                  loading={deleteAll.isPending}
                  onClick={confirmDeleteAll}
                >
                  <IconTrash size={13} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        <Divider />

        {/* Body */}
        {isLoading ? (
          <Stack align="center" py="xl">
            <Loader size="sm" />
          </Stack>
        ) : items.length === 0 ? (
          <Box py="xl" ta="center">
            <IconBell size={32} color="var(--mantine-color-gray-4)" />
            <Text size="sm" c="dimmed" mt="xs">No notifications</Text>
          </Box>
        ) : (
          <ScrollArea.Autosize mah={400}>
            {items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onRead={(id) => markAsRead.mutate(id as never)}
                onDelete={(id) => confirmDeleteOne(id)}
              />
            ))}
          </ScrollArea.Autosize>
        )}

        {/* Footer */}
        {data && data.totalPages > 1 && (
          <>
            <Divider />
            <Box px="sm" py="xs" ta="center">
              <Text size="xs" c="dimmed">{data.totalElements} total notifications</Text>
            </Box>
          </>
        )}
      </Popover.Dropdown>
    </Popover>
  )
}
