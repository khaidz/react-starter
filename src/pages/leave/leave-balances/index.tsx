import { leaveBalancesApi } from '@/api/leave-balances.api'
import { leaveTypesApi } from '@/api/leave-types.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { LeaveBalanceItem } from '@/types/api'
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconRefresh } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'

const PAGE_SIZE_OPTIONS = ['10', '20', '50']

export function LeaveBalancePage() {
  const queryClient = useQueryClient()
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<LeaveBalanceItem | null>(null)
  const [newTotalDays, setNewTotalDays] = useState<number | string>(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filterValues, setFilterValues] = useState({ username: '' })

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)
  useEffect(() => { setPage(1) }, [filterValues, sorting, pageSize])

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types', 'active'],
    queryFn: () => leaveTypesApi.listActive(),
    staleTime: 60_000,
  })

  const currentYear = new Date().getFullYear()

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['leave-balances', 'paged', { ...filterValues, page, pageSize, sort }],
    queryFn: () =>
      leaveBalancesApi.search({
        username: filterValues.username || undefined,
        year: currentYear,
        page,
        size: pageSize,
        sort: sort.length ? sort[0] : undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const items: LeaveBalanceItem[] = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const updateMutation = useMutation<void, Error, { id: string; totalDays: number }>({
    mutationFn: ({ id, totalDays }) => leaveBalancesApi.update(id, totalDays).then(() => {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
      notifications.show({ message: 'Balance updated', color: 'green' })
      closeEdit()
    },
    onError: (e) => notifyError(e),
  })

  const initYearMutation = useMutation<void, Error, void>({
    mutationFn: () => leaveBalancesApi.initYear(currentYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
      notifications.show({ message: `Balances initialized for ${currentYear}`, color: 'green' })
    },
    onError: (e) => notifyError(e),
  })

  function handleEdit(item: LeaveBalanceItem) {
    setEditItem(item)
    setNewTotalDays(item.totalDays)
    openEdit()
  }

  const leaveTypeMap = Object.fromEntries((leaveTypes ?? []).map((t) => [t.id, t.name]))

  const columns: TableColumn<LeaveBalanceItem>[] = [
    {
      id: 'username',
      header: 'User',
      enableColumnFilter: true,
      filterPlaceholder: 'Search by username...',
      accessorFn: (row) => row.username,
      cell: (row) => row.username,
    },
    {
      id: 'leaveTypeName',
      header: 'Leave Type',
      cell: (row) => leaveTypeMap[row.leaveTypeId] ?? row.leaveTypeName,
    },
    { id: 'year', header: 'Year', cell: (row) => row.year },
    { id: 'totalDays', header: 'Total', cell: (row) => row.totalDays },
    { id: 'usedDays', header: 'Used', cell: (row) => row.usedDays },
    {
      id: 'remainingDays',
      header: 'Remaining',
      cell: (row) => (
        <Text fw={500} c={row.remainingDays === 0 ? 'red' : row.remainingDays <= 3 ? 'orange' : 'green'}>
          {row.remainingDays}
        </Text>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 80,
      align: 'center',
      cell: (row) => (
        <Tooltip label="Edit total days" withArrow>
          <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEdit(row)}>
            <IconEdit size={15} />
          </ActionIcon>
        </Tooltip>
      ),
    },
  ]

  return (
    <>
      <title>Leave Balances</title>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={3}>Leave Balances — {currentYear}</Title>
          <Button
            size="sm"
            variant="light"
            leftSection={<IconRefresh size={14} />}
            loading={initYearMutation.isPending}
            onClick={() => initYearMutation.mutate(undefined)}
          >
            Init Year {currentYear}
          </Button>
        </Group>

        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={isLoading}
          emptyText="No leave balances found"
          sorting={sorting}
          onSortingChange={setSorting}
          onRefresh={() => refetch()}
          refreshing={isFetching && !isLoading}
          columnFilterValues={filterValues}
          onColumnFilterChange={(id, value) => setFilterValues((prev) => ({ ...prev, [id]: value as string }))}
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

        <Modal opened={editOpened} onClose={closeEdit} title="Edit Leave Balance" centered size="xs">
          {editItem && (
            <Stack gap="sm">
              <Text size="sm" c="dimmed">{editItem.username} · {editItem.leaveTypeName} · {editItem.year}</Text>
              <NumberInput
                label="Total Days"
                min={editItem.usedDays}
                value={newTotalDays}
                onChange={setNewTotalDays}
              />
              <Group justify="flex-end" mt="xs">
                <Button variant="default" onClick={closeEdit}>Cancel</Button>
                <Button
                  loading={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: editItem.id, totalDays: Number(newTotalDays) })}
                >
                  Save
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Stack>
    </>
  )
}
