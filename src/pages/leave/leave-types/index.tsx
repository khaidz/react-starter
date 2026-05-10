import { leaveTypesApi } from '@/api/leave-types.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { LeaveTypeItem } from '@/types/api'
import { ActionIcon, Badge, Button, Group, Pagination, Select, Stack, Text, Title, Tooltip } from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { LeaveTypeModal } from './components/LeaveTypeModal'

const PAGE_SIZE_OPTIONS = ['10', '20', '50']

export function LeaveTypePage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<LeaveTypeItem | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filterValues, setFilterValues] = useState({ name: '' })
  const [debouncedName] = useDebouncedValue(filterValues.name, 600)

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)

  useEffect(() => { setPage(1) }, [debouncedName, sorting, pageSize])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['leave-types', 'paged', { name: debouncedName, page, pageSize, sort }],
    queryFn: () => leaveTypesApi.search({ name: debouncedName || undefined, page, size: pageSize, sort: sort.length ? sort[0] : undefined }),
    placeholderData: keepPreviousData,
  })

  const items: LeaveTypeItem[] = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leaveTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] })
      notifications.show({ message: 'Leave type deleted', color: 'green' })
    },
    onError: notifyError,
  })

  function handleAdd() { setEditItem(null); openModal() }
  function handleEdit(item: LeaveTypeItem) { setEditItem(item); openModal() }
  function handleDelete(item: LeaveTypeItem) {
    modals.openConfirmModal({
      title: 'Delete Leave Type',
      children: <Text size="sm">Delete <strong>{item.name}</strong>? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(item.id),
    })
  }

  const columns: TableColumn<LeaveTypeItem>[] = [
    {
      id: 'name',
      header: 'Name',
      enableSorting: true,
      enableColumnFilter: true,
      filterPlaceholder: 'Search by name...',
      accessorFn: (row) => row.name,
      cell: (row) => row.name,
    },
    {
      id: 'maxDaysPerYear',
      header: 'Max Days/Year',
      accessorFn: (row) => row.maxDaysPerYear,
      cell: (row) => row.maxDaysPerYear,
    },
    {
      id: 'isPaid',
      header: 'Type',
      cell: (row) => (
        <Badge size="sm" variant="light" color={row.isPaid ? 'blue' : 'orange'}>
          {row.isPaid ? 'Paid' : 'Unpaid'}
        </Badge>
      ),
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (row) => (
        <Badge size="sm" color={row.isActive ? 'green' : 'gray'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 90,
      align: 'center',
      cell: (row) => (
        <Group gap={4} justify="center" wrap="nowrap">
          <Tooltip label="Edit" withArrow>
            <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEdit(row)}>
              <IconEdit size={15} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete" withArrow>
            <ActionIcon size="sm" variant="subtle" color="red" loading={deleteMutation.isPending} onClick={() => handleDelete(row)}>
              <IconTrash size={15} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ]

  return (
    <>
      <title>Leave Types</title>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={3}>Leave Types</Title>
        </Group>
        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={isLoading}
          emptyText="No leave types found"
          sorting={sorting}
          onSortingChange={setSorting}
          onRefresh={() => refetch()}
          refreshing={isFetching && !isLoading}
          columnFilterValues={filterValues}
          onColumnFilterChange={(id, value) => setFilterValues((prev) => ({ ...prev, [id]: value as string }))}
          toolbar={
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
              Add New
            </Button>
          }
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
        <LeaveTypeModal opened={modalOpened} onClose={closeModal} editItem={editItem} />
      </Stack>
    </>
  )
}
