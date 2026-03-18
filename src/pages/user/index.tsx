import { usersApi } from '@/api/users.api'
import { departmentsApi } from '@/api/departments.api'
import { rolesApi } from '@/api/roles.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import type { SortingState } from '@tanstack/react-table'
import { notifyError } from '@/lib/notify'
import type { UserItem, UserStatus } from '@/types/api'
import { ActionIcon, Badge, Button, Group, Pagination, Select, Stack, Text, Title, Tooltip } from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { UserModal, STATUS_OPTIONS } from './components/UserModal'

const STATUS_COLOR: Record<UserStatus, string> = {
  ACTIVE: 'green',
  PENDING: 'yellow',
  LOCKED: 'red',
  DELETED: 'gray',
}

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100']

export function UserPage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<UserItem | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])

  const [filterValues, setFilterValues] = useState<{
    username: string; email: string; status: string[]; roles: string[]; department: string[];
  }>({
    username: '', email: '', status: [], roles: [], department: [],
  })
  const [debouncedUsername] = useDebouncedValue(filterValues.username, 1000)
  const [debouncedEmail] = useDebouncedValue(filterValues.email, 1000)

  function handleColumnFilterChange(id: string, value: string | string[]) {
    setFilterValues((prev) => ({ ...prev, [id]: value }))
  }

  useEffect(() => {
    setPage(1)
  }, [
    debouncedUsername, debouncedEmail,
    filterValues.status.join(','), filterValues.roles.join(','), filterValues.department.join(','),
    sorting, pageSize,
  ])

  const { data: allDepts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    staleTime: 60_000,
  })

  const { data: allRoles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
    staleTime: 60_000,
  })

  const deptOptions = allDepts.map((d) => ({
    value: String(d.id),
    label: d.name,
  }))

  const roleOptions = allRoles.map((r) => ({ value: r.name, label: r.name }))

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['users', {
      username: debouncedUsername, email: debouncedEmail,
      status: filterValues.status, role: filterValues.roles, deptId: filterValues.department,
      page, pageSize, sort,
    }],
    queryFn: () =>
      usersApi.search({
        username: debouncedUsername || undefined,
        email: debouncedEmail || undefined,
        status: filterValues.status.length ? (filterValues.status as UserStatus[]) : undefined,
        role: filterValues.roles.length ? filterValues.roles : undefined,
        deptId: filterValues.department.length ? filterValues.department : undefined,
        page: page,
        size: pageSize,
        sort: sort.length ? sort : undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const users: UserItem[] = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notifications.show({ message: 'User deleted successfully', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  function handleAdd() {
    setEditItem(null)
    openModal()
  }

  function handleEdit(item: UserItem) {
    setEditItem(item)
    openModal()
  }

  function handleDelete(item: UserItem) {
    modals.openConfirmModal({
      title: 'Delete User',
      children: (
        <Text size="sm">
          Are you sure you want to delete user <strong>{item.username}</strong>? This action cannot
          be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(item.id),
    })
  }

  const columns: TableColumn<UserItem>[] = [
    { id: 'id', header: 'ID', width: 200, accessorFn: (row) => row.id, copyable: true, cell: (row) => row.id },
    {
      id: 'username',
      header: 'Username',
      width: 200,
      enableSorting: true,
      enableColumnFilter: true,
      filterPlaceholder: 'Username...',
      accessorFn: (row) => row.username,
      cell: (row) => <Text fw={500}>{row.username}</Text>,
    },
    {
      id: 'email',
      header: 'Email',
      width: 200,
      enableSorting: true,
      enableColumnFilter: true,
      filterPlaceholder: 'Email...',
      accessorFn: (row) => row.email,
      cell: (row) => row.email,
    },
    {
      id: 'status',
      header: 'Status',
      width: 100,
      align: 'center',
      enableSorting: true,
      enableColumnFilter: true,
      filterType: 'multi-select',
      filterPlaceholder: 'All...',
      filterOptions: STATUS_OPTIONS,
      accessorFn: (row) => row.status,
      cell: (row) => (
        <Badge size="sm" variant="light" color={STATUS_COLOR[row.status]}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: 'roles',
      header: 'Roles',
      width: 150,
      enableColumnFilter: true,
      filterType: 'multi-select',
      filterPlaceholder: 'All...',
      filterOptions: roleOptions,
      accessorFn: (row) => row.roles?.join(', ') ?? '',
      cell: (row) => (
        <Group gap={4} wrap="wrap">
          {row.roles?.length ? (
            row.roles.map((r) => (
              <Badge key={r} size="xs" variant="light" color="blue">{r}</Badge>
            ))
          ) : (
            <Text size="sm" c="dimmed">—</Text>
          )}
        </Group>
      ),
    },
    {
      id: 'department',
      header: 'Department',
      width: 200,
      enableColumnFilter: true,
      filterType: 'multi-select',
      filterPlaceholder: 'All...',
      filterOptions: deptOptions,
      accessorFn: (row) => row.deptName ?? '',
      cell: (row) => <Text size='sm' c={row.deptName ? undefined : 'dimmed'}>{row.deptName ?? '—'}</Text>,
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
    <title>User Management</title>
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Title order={3}>User Management</Title>
      </Group>

      <DataTable
        columns={columns}
        data={users}
        keyField="id"
        loading={isLoading}
        emptyText="No users found"
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

      <UserModal opened={modalOpened} onClose={closeModal} editItem={editItem} />
    </Stack>
    </>
  )
}
