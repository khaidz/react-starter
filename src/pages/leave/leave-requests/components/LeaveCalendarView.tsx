import { leaveRequestsApi } from '@/api/leave-requests.api'
import type { LeaveRequestItem, LeaveRequestStatus } from '@/types/api'
import { ActionIcon, Box, Group, Loader, Paper, Popover, Stack, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

const STATUS_COLOR: Record<LeaveRequestStatus, string> = {
  PENDING: 'var(--mantine-color-yellow-6)',
  APPROVED: 'var(--mantine-color-green-6)',
  REJECTED: 'var(--mantine-color-red-5)',
  CANCELLED: 'var(--mantine-color-gray-5)',
}

const STATUS_BG: Record<LeaveRequestStatus, string> = {
  PENDING: 'var(--mantine-color-yellow-0)',
  APPROVED: 'var(--mantine-color-green-0)',
  REJECTED: 'var(--mantine-color-red-0)',
  CANCELLED: 'var(--mantine-color-gray-1)',
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  onCancel: (item: LeaveRequestItem) => void
  toolbarRight?: ReactNode
}

export function LeaveCalendarView({ onCancel, toolbarRight }: Props) {
  const [month, setMonth] = useState(() => dayjs().startOf('month'))

  const { data, isLoading } = useQuery({
    queryKey: ['leave-requests', 'calendar', month.format('YYYY-MM')],
    queryFn: () =>
      leaveRequestsApi.search(
        {
          myRequestsOnly: true,
          fromDate: month.format('YYYY-MM-DD'),
          toDate: month.endOf('month').format('YYYY-MM-DD'),
        },
        { page: 1, size: 200 },
      ),
    staleTime: 30_000,
  })

  const requests = data?.content ?? []

  // Build date → requests map (multi-day requests appear on each day)
  const dayMap = useMemo(() => {
    const map: Record<string, LeaveRequestItem[]> = {}
    for (const req of requests) {
      let cur = dayjs(req.startDate)
      const end = dayjs(req.endDate)
      while (!cur.isAfter(end)) {
        const key = cur.format('YYYY-MM-DD')
        ;(map[key] ??= []).push(req)
        cur = cur.add(1, 'day')
      }
    }
    return map
  }, [requests])

  // 42 cells starting from Monday of the first week of the month
  const cells = useMemo(() => {
    const first = month.startOf('month')
    const offset = (first.day() + 6) % 7 // Mon=0 … Sun=6
    return Array.from({ length: 42 }, (_, i) => first.subtract(offset, 'day').add(i, 'day'))
  }, [month])

  const todayStr = dayjs().format('YYYY-MM-DD')

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Box style={{ width: 100 }} />
        <Group gap="sm">
          <ActionIcon variant="default" onClick={() => setMonth((m) => m.subtract(1, 'month'))}>
            <IconChevronLeft size={16} />
          </ActionIcon>
          <Text fw={600} w={160} ta="center">
            {month.format('MMMM YYYY')}
          </Text>
          <ActionIcon variant="default" onClick={() => setMonth((m) => m.add(1, 'month'))}>
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>
        <Box>{toolbarRight}</Box>
      </Group>

      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        {/* Weekday headers */}
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid var(--mantine-color-default-border)',
          }}
        >
          {WEEKDAYS.map((d, i) => (
            <Text
              key={d}
              ta="center"
              size="sm"
              fw={500}
              c="dimmed"
              py={8}
              style={{
                borderRight: i < 6 ? '1px solid var(--mantine-color-default-border)' : undefined,
              }}
            >
              {d}
            </Text>
          ))}
        </Box>

        {/* Day cells */}
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : (
          <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const key = day.format('YYYY-MM-DD')
              const isCurrentMonth = day.month() === month.month()
              const isToday = key === todayStr
              const reqs = dayMap[key] ?? []
              const col = i % 7
              const row = Math.floor(i / 7)

              return (
                <Box
                  key={key}
                  style={{
                    minHeight: 100,
                    padding: '6px 6px 4px',
                    borderRight:
                      col < 6 ? '1px solid var(--mantine-color-default-border)' : undefined,
                    borderBottom:
                      row < 5 ? '1px solid var(--mantine-color-default-border)' : undefined,
                    opacity: isCurrentMonth ? 1 : 0.35,
                    backgroundColor: isToday
                      ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-6))'
                      : undefined,
                  }}
                >
                  {/* Day number */}
                  <Box
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 4,
                      backgroundColor: isToday ? 'var(--mantine-color-blue-6)' : undefined,
                    }}
                  >
                    <Text
                      size="sm"
                      fw={isToday ? 700 : 400}
                      c={isToday ? 'white' : undefined}
                      lh={1}
                    >
                      {day.date()}
                    </Text>
                  </Box>

                  {/* Events */}
                  <Stack gap={2}>
                    {reqs.map((req) => (
                      <EventChip key={req.id + key} req={req} onCancel={onCancel} />
                    ))}
                  </Stack>
                </Box>
              )
            })}
          </Box>
        )}
      </Paper>

      {/* Legend */}
      <Group gap="md" justify="center">
        {(Object.keys(STATUS_COLOR) as LeaveRequestStatus[]).map((s) => (
          <Group key={s} gap={4} align="center">
            <Box
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: STATUS_COLOR[s],
              }}
            />
            <Text size="sm" c="dimmed">
              {s}
            </Text>
          </Group>
        ))}
      </Group>
    </Stack>
  )
}

function EventChip({
  req,
  onCancel,
}: {
  req: LeaveRequestItem
  onCancel: (item: LeaveRequestItem) => void
}) {
  const canCancel = req.status === 'PENDING' || req.status === 'APPROVED'

  return (
    <Popover width={220} shadow="sm" withArrow position="top" withinPortal>
      <Popover.Target>
        <Box
          title={req.leaveTypeName}
          style={{
            backgroundColor: STATUS_BG[req.status],
            borderLeft: `3px solid ${STATUS_COLOR[req.status]}`,
            borderRadius: '0 3px 3px 0',
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: 13,
            lineHeight: '20px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {req.leaveTypeName}
        </Box>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={4}>
          <Text fw={600} size="sm">
            {req.leaveTypeName}
          </Text>
          <Text size="xs" c="dimmed">
            {req.startDate} → {req.endDate} · {req.totalDays}d
          </Text>
          <Text size="xs">
            Status:{' '}
            <span style={{ color: STATUS_COLOR[req.status], fontWeight: 600 }}>{req.status}</span>
          </Text>
          {req.reason && (
            <Text size="xs" c="dimmed" fs="italic">
              {req.reason}
            </Text>
          )}
          {req.approverComment && (
            <Text size="xs" c="dimmed">
              Note: {req.approverComment}
            </Text>
          )}
          {canCancel && (
            <Text
              size="xs"
              c="orange"
              mt={4}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => onCancel(req)}
            >
              Cancel request
            </Text>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
