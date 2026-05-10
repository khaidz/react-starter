import { leaveRequestsApi, type SearchLeaveRequestPayload } from '@/api/leave-requests.api'
import { leaveTypesApi } from '@/api/leave-types.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import { usePermission } from '@/hooks/use-permission'
import type { LeaveRequestItem, LeaveRequestStatus } from '@/types/api'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Pagination,
  Select,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconCalendar, IconCheck, IconLayoutList, IconPlus, IconX } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { LeaveCalendarView } from './components/LeaveCalendarView'
import { LeaveRequestModal } from './components/LeaveRequestModal'
import { ProcessRequestModal } from './components/ProcessRequestModal'

const PAGE_SIZE_OPTIONS = ['10', '20', '50']

const STATUS_COLORS: Record<LeaveRequestStatus, string> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
}

export function LeaveRequestPage() {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const canApprove = can(['ADMIN'], ['leave-request:approve'])

  const [newModalOpened, { open: openNew, close: closeNew }] = useDisclosure(false)
  const [processOpened, { open: openProcess, close: closeProcess }] = useDisclosure(false)
  const [processItem, setProcessItem] = useState<LeaveRequestItem | null>(null)
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve')
  const [activeTab, setActiveTab] = useState<string>('mine')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])

  useEffect(() => { setPage(1) }, [activeTab, sorting, pageSize])
  useEffect(() => { if (activeTab !== 'mine') setViewMode('list') }, [activeTab])

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types', 'active'],
    queryFn: () => leaveTypesApi.listActive(),
    staleTime: 60_000,
  })

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)

  const searchBody: SearchLeaveRequestPayload =
    activeTab === 'mine'
      ? { myRequestsOnly: true }
      : activeTab === 'pending'
        ? { statuses: ['PENDING'] }
        : {}

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['leave-requests', activeTab, { page, pageSize, sort }],
    queryFn: () => leaveRequestsApi.search(searchBody, { page, size: pageSize, sort: sort.length ? sort[0] : undefined }),
    placeholderData: keepPreviousData,
  })

  const items: LeaveRequestItem[] = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveRequestsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      notifications.show({ message: 'Request cancelled', color: 'green' })
    },
    onError: notifyError,
  })

  function handleCancel(item: LeaveRequestItem) {
    modals.openConfirmModal({
      title: 'Cancel Request',
      children: <Text size="sm">Cancel your leave request from <strong>{item.startDate}</strong> to <strong>{item.endDate}</strong>?</Text>,
      labels: { confirm: 'Cancel Request', cancel: 'Keep' },
      confirmProps: { color: 'orange' },
      onConfirm: () => cancelMutation.mutate(item.id),
    })
  }

  function handleProcess(item: LeaveRequestItem, action: 'approve' | 'reject') {
    setProcessItem(item)
    setProcessAction(action)
    openProcess()
  }

  const viewToggle = (
    <Group gap={4}>
      <Tooltip label="List view" withArrow position="left">
        <ActionIcon
          variant={viewMode === 'list' ? 'light' : 'subtle'}
          color={viewMode === 'list' ? 'blue' : 'gray'}
          onClick={() => setViewMode('list')}
        >
          <IconLayoutList size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Calendar view" withArrow position="left">
        <ActionIcon
          variant={viewMode === 'calendar' ? 'light' : 'subtle'}
          color={viewMode === 'calendar' ? 'blue' : 'gray'}
          onClick={() => setViewMode('calendar')}
        >
          <IconCalendar size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )

  const leaveTypeMap = Object.fromEntries((leaveTypes ?? []).map((t) => [t.id, t.name]))

  const columns: TableColumn<LeaveRequestItem>[] = [
    {
      id: 'requesterUsername',
      header: 'Requester',
      accessorFn: (row) => row.requesterUsername,
      cell: (row) => row.requesterUsername,
    },
    {
      id: 'leaveTypeName',
      header: 'Type',
      cell: (row) => leaveTypeMap[row.leaveTypeId] ?? row.leaveTypeName,
    },
    {
      id: 'startDate',
      header: 'From',
      enableSorting: true,
      accessorFn: (row) => row.startDate,
      cell: (row) => row.startDate,
    },
    {
      id: 'endDate',
      header: 'To',
      accessorFn: (row) => row.endDate,
      cell: (row) => row.endDate,
    },
    {
      id: 'totalDays',
      header: 'Days',
      cell: (row) => row.totalDays,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge size="sm" color={STATUS_COLORS[row.status]}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 100,
      align: 'center',
      cell: (row) => (
        <Group gap={4} justify="center" wrap="nowrap">
          {row.status === 'PENDING' && canApprove && (
            <>
              <Tooltip label="Approve" withArrow>
                <ActionIcon size="sm" variant="subtle" color="green" onClick={() => handleProcess(row, 'approve')}>
                  <IconCheck size={15} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Reject" withArrow>
                <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleProcess(row, 'reject')}>
                  <IconX size={15} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
          {(row.status === 'PENDING' || row.status === 'APPROVED') && activeTab === 'mine' && (
            <Tooltip label="Cancel" withArrow>
              <ActionIcon size="sm" variant="subtle" color="orange" loading={cancelMutation.isPending} onClick={() => handleCancel(row)}>
                <IconX size={15} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ),
    },
  ]

  return (
    <>
      <title>Leave Requests</title>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={3}>Leave Requests</Title>
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openNew}>
            New Request
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={(v) => v && setActiveTab(v)}>
          <Tabs.List>
            <Tabs.Tab value="mine">My Requests</Tabs.Tab>
            {canApprove && <Tabs.Tab value="pending">Pending Approval</Tabs.Tab>}
            {canApprove && <Tabs.Tab value="all">All Requests</Tabs.Tab>}
          </Tabs.List>
        </Tabs>

        {activeTab === 'mine' && viewMode === 'calendar' ? (
          <LeaveCalendarView onCancel={handleCancel} toolbarRight={viewToggle} />
        ) : (
          <DataTable
            columns={columns}
            data={items}
            keyField="id"
            loading={isLoading}
            emptyText="No leave requests found"
            sorting={sorting}
            onSortingChange={setSorting}
            onRefresh={() => refetch()}
            refreshing={isFetching && !isLoading}
            toolbarRight={activeTab === 'mine' ? viewToggle : undefined}
            footer={
              totalElements > 0 && (
                <Group justify="space-between" align="center">
                  <Group gap="xs" align="center">
                    <Text size="sm" c="dimmed">Rows per page:</Text>
                    <Select size="xs" w={70} data={PAGE_SIZE_OPTIONS} value={String(pageSize)} onChange={(v) => v && setPageSize(Number(v))} allowDeselect={false} />
                    <Text size="sm" c="dimmed">
                      {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)} of {totalElements}
                    </Text>
                  </Group>
                  {totalPages > 1 && <Pagination size="sm" total={totalPages} value={page} onChange={setPage} />}
                </Group>
              )
            }
          />
        )}

        <LeaveRequestModal opened={newModalOpened} onClose={closeNew} />
        <ProcessRequestModal opened={processOpened} onClose={closeProcess} item={processItem} action={processAction} />
      </Stack>
    </>
  )
}
