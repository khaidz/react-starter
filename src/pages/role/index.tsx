import { rolesApi } from '@/api/roles.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { RoleItem } from '@/types/api'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Pagination,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { RoleModal } from './components/RoleModal'

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100']

export function RolePage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<RoleItem | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filterValues, setFilterValues] = useState({ name: '' })
  const [debouncedName] = useDebouncedValue(filterValues.name, 1000)

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)

  useEffect(() => {
    setPage(1)
  }, [debouncedName, sorting, pageSize])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['roles', 'paged', { name: debouncedName, page, pageSize, sort }],
    queryFn: () =>
      rolesApi.searchPaged({
        name: debouncedName || undefined,
        page,
        size: pageSize,
        sort: sort.length ? sort : undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const roles: RoleItem[] = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      notifications.show({ message: 'Role deleted successfully', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  function handleAdd() {
    setEditItem(null)
    openModal()
  }

  function handleEdit(item: RoleItem) {
    setEditItem(item)
    openModal()
  }

  function handleDelete(item: RoleItem) {
    modals.openConfirmModal({
      title: 'Delete Role',
      children: (
        <Text size="sm">
          Are you sure you want to delete role <strong>{item.name}</strong>? This action cannot be
          undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(item.id),
    })
  }

  function handleColumnFilterChange(id: string, value: string | string[]) {
    setFilterValues((prev) => ({ ...prev, [id]: value as string }))
  }

  const columns: TableColumn<RoleItem>[] = [
    { id: 'id', header: 'ID', accessorFn: (row) => row.id, copyable: true, cell: (row) => row.id },
    {
      id: 'name',
      header: 'Role Name',
      enableSorting: true,
      enableColumnFilter: true,
      accessorFn: (row) => row.name,
      filterPlaceholder: 'Search by name...',
      cell: (row) => <Text fz="sm">{row.name}</Text>,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => (
        <Text c={row.description ? undefined : 'dimmed'} fz="sm">
          {row.description || '—'}
        </Text>
      ),
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: (row) => (
        <Group gap={4} wrap="wrap">
          {row.permissions?.length ? (
            row.permissions.map((p) => (
              <Badge key={p.id} size="xs" variant="light">
                {p.name}
              </Badge>
            ))
          ) : (
            <Text size="sm" c="dimmed">
              —
            </Text>
          )}
        </Group>
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
      <title>Role Management</title>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={3}>Role Management</Title>
        </Group>

        <DataTable
          columns={columns}
          data={roles}
          keyField="id"
          loading={isLoading}
          emptyText="No roles found"
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
                  <Text size="sm" c="dimmed">
                    Rows per page:
                  </Text>
                  <Select
                    size="xs"
                    w={70}
                    data={PAGE_SIZE_OPTIONS}
                    value={String(pageSize)}
                    onChange={(v) => v && setPageSize(Number(v))}
                    allowDeselect={false}
                  />
                  <Text size="sm" c="dimmed">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)} of{' '}
                    {totalElements}
                  </Text>
                </Group>
                {totalPages > 1 && (
                  <Pagination size="sm" total={totalPages} value={page} onChange={setPage} />
                )}
              </Group>
            )
          }
        />

        <RoleModal opened={modalOpened} onClose={closeModal} editItem={editItem} />
      </Stack>
    </>
  )
}
