import { notificationsApi } from '@/api/notifications.api'
import type { NotificationItem } from '@/api/notifications.api'
import { notifyError } from '@/lib/notify'
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Loader,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconBell, IconCheck, IconInfoCircle, IconMessage, IconTrash } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

function typeIcon(type: string) {
  switch (type) {
    case 'COMMENT': return <IconMessage size={16} color="var(--mantine-color-green-6)" />
    case 'SYSTEM':  return <IconInfoCircle size={16} color="var(--mantine-color-blue-6)" />
    default:        return <IconBell size={16} color="var(--mantine-color-gray-5)" />
  }
}

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
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()

  function handleClick() {
    if (!item.read) onRead(item.id)
    if (item.targetUrl) navigate(item.targetUrl)
  }

  return (
    <UnstyledButton
      w="100%"
      p="md"
      style={{
        borderLeft: item.read ? undefined : '3px solid var(--mantine-color-blue-5)',
        backgroundColor: item.read ? undefined : 'var(--mantine-color-blue-0)',
        cursor: item.targetUrl || !item.read ? 'pointer' : 'default',
      }}
      onClick={handleClick}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Box style={{ flexShrink: 0, lineHeight: 1 }}>{typeIcon(item.type)}</Box>
            {!item.read && <Badge size="xs" color="blue" variant="filled">New</Badge>}
            <Text size="sm" fw={item.read ? 400 : 600} truncate>
              {item.title}
            </Text>
          </Group>
          {item.body && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {item.body}
            </Text>
          )}
          <Text size="xs" c="dimmed" mt={2}>
            {timeAgo(item.createdAt)}
          </Text>
        </Stack>
        <Group gap={4} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
          {!item.read && (
            <Tooltip label="Mark as read" withArrow>
              <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onRead(item.id)}>
                <IconCheck size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Delete" withArrow>
            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDelete(item.id)}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </UnstyledButton>
  )
}

const PAGE_SIZE_OPTIONS = ['10', '20', '50']

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const queryParams = {
    page,
    size: pageSize,
    isRead: filter === 'all' ? undefined : filter === 'read',
  }

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page', queryParams],
    queryFn: () => notificationsApi.list(queryParams),
    placeholderData: keepPreviousData,
  })

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.unreadCount,
  })

  const items: NotificationItem[] = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0
  const unreadCount = unreadData?.unreadCount ?? 0

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['notifications-page'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
  }

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e),
  })

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: invalidate,
    onError: (e) => notifyError(e),
  })

  const deleteOne = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e),
  })

  const deleteAll = useMutation({
    mutationFn: () => notificationsApi.deleteAll(),
    onSuccess: invalidate,
    onError: (e) => notifyError(e),
  })

  function confirmDeleteOne(id: string) {
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
      children: (
        <Text size="sm">Are you sure you want to delete all notifications? This cannot be undone.</Text>
      ),
      labels: { confirm: 'Delete all', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteAll.mutate(undefined),
    })
  }

  function handleFilterChange(value: string) {
    setFilter(value as 'all' | 'unread' | 'read')
    setPage(1)
  }

  return (
    <>
      <title>Notifications</title>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Title order={3}>Notifications</Title>
            {unreadCount > 0 && (
              <Badge color="red" variant="filled" size="sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            {unreadCount > 0 && (
              <Tooltip label="Mark all as read" withArrow>
                <ActionIcon
                  variant="light"
                  color="blue"
                  loading={markAllAsRead.isPending}
                  onClick={() => markAllAsRead.mutate(undefined)}
                >
                  <IconCheck size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {totalElements > 0 && (
              <Tooltip label="Delete all" withArrow>
                <ActionIcon
                  variant="light"
                  color="red"
                  loading={deleteAll.isPending}
                  onClick={confirmDeleteAll}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        <SegmentedControl
          value={filter}
          onChange={handleFilterChange}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Unread', value: 'unread' },
            { label: 'Read', value: 'read' },
          ]}
          w="fit-content"
        />

        <Card withBorder p={0}>
          {isLoading ? (
            <Stack align="center" py="xl">
              <Loader size="sm" />
            </Stack>
          ) : items.length === 0 ? (
            <Box py="xl" ta="center">
              <IconBell size={40} color="var(--mantine-color-gray-4)" />
              <Text size="md" c="dimmed" mt="xs">No notifications</Text>
            </Box>
          ) : (
            items.map((item, index) => (
              <Box key={item.id}>
                {index > 0 && <Divider />}
                <NotificationRow
                  item={item}
                  onRead={(id) => markAsRead.mutate(id)}
                  onDelete={(id) => confirmDeleteOne(id)}
                />
              </Box>
            ))
          )}
        </Card>

        {totalElements > 0 && (
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <Text size="sm" c="dimmed">Rows per page:</Text>
              <Select
                size="xs"
                w={70}
                data={PAGE_SIZE_OPTIONS}
                value={String(pageSize)}
                onChange={(v) => {
                  if (v) {
                    setPageSize(Number(v))
                    setPage(1)
                  }
                }}
                allowDeselect={false}
              />
              <Text size="sm" c="dimmed">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)} of {totalElements}
              </Text>
            </Group>
            {totalPages > 1 && (
              <Pagination size="sm" total={totalPages} value={page} onChange={setPage} />
            )}
          </Group>
        )}
      </Stack>
    </>
  )
}
