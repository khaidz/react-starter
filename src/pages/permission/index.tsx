import { permissionsApi } from '@/api/permissions.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { PermissionItem } from '@/types/api'
import { ActionIcon, Button, Group, Pagination, Select, Stack, Text, Title, Tooltip } from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { PermissionModal } from './components/PermissionModal'

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100']

export function PermissionPage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<PermissionItem | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])

  const [filterValues, setFilterValues] = useState({ name: '' })
  const [debouncedName] = useDebouncedValue(filterValues.name, 1000)

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)

  function handleColumnFilterChange(id: string, value: string | string[]) {
    setFilterValues((prev) => ({ ...prev, [id]: value as string }))
  }

  useEffect(() => { setPage(1) }, [debouncedName, sorting, pageSize])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['permissions', 'paged', { name: debouncedName, page, pageSize, sort }],
    queryFn: () => permissionsApi.searchPaged({ name: debouncedName || undefined, page: page, size: pageSize, sort: sort.length ? sort : undefined }),
    placeholderData: keepPreviousData,
  })

  const permissions: PermissionItem[] = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  const deleteMutation = useMutation({
    mutationFn: (id: string) => permissionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      notifications.show({ message: 'Permission deleted successfully', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  function handleAdd() {
    setEditItem(null)
    openModal()
  }

  function handleEdit(item: PermissionItem) {
    setEditItem(item)
    openModal()
  }

  function handleDelete(item: PermissionItem) {
    modals.openConfirmModal({
      title: 'Delete Permission',
      children: (
        <Text size="sm">
          Are you sure you want to delete permission <strong>{item.name}</strong>? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(item.id),
    })
  }

  const columns: TableColumn<PermissionItem>[] = [
    { id: 'id', header: 'ID', accessorFn: (row) => row.id, copyable: true, cell: (row) => row.id },
    {
      id: 'name',
      header: 'Permission Name',
      enableSorting: true,
      enableColumnFilter: true,
      filterPlaceholder: 'Name...',
      accessorFn: (row) => row.name,
      cell: (row) => row.name,
    },
    {
      id: 'description',
      header: 'Description',
      accessorFn: (row) => row.description ?? '',
      cell: (row) => (
        <Text c={row.description ? undefined : 'dimmed'} size='sm'>{row.description || '—'}</Text>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 100,
      align: 'center',
      cell: (row) => (
        <Group gap={4} justify="center" wrap="nowrap">
          <Tooltip label="Edit" withArrow>
            <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEdit(row)}>
              <IconEdit size={15} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              loading={deleteMutation.isPending}
              onClick={() => handleDelete(row)}
            >
              <IconTrash size={15} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ]

  return (
    <>
    <title>Permission Management</title>
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Title order={3}>Permission Management</Title>
      </Group>

      <DataTable
        columns={columns}
        data={permissions}
        keyField="id"
        loading={isLoading}
        emptyText="No permissions found"
        sorting={sorting}
        onSortingChange={setSorting}
        onRefresh={() => refetch()}
        refreshing={isFetching && !isLoading}
        columnFilterValues={filterValues}
        onColumnFilterChange={handleColumnFilterChange}
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
                <Select
                  size="xs"
                  w={70}
                  data={PAGE_SIZE_OPTIONS}
                  value={String(pageSize)}
                  onChange={(v) => v && setPageSize(Number(v))}
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
          )
        }
      />

      <PermissionModal opened={modalOpened} onClose={closeModal} editItem={editItem} />
    </Stack>
    </>
  )
}
