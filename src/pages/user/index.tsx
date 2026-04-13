import { usersApi, type CreateUserPayload, type UpdateUserPayload } from '@/api/users.api'
import { departmentsApi } from '@/api/departments.api'
import { rolesApi } from '@/api/roles.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import type { SortingState } from '@tanstack/react-table'
import { notifyError } from '@/lib/notify'
import type { UserItem, UserStatus } from '@/types/api'
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Pagination,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { MultiSelect } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

// ── Constants ────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'LOCKED', label: 'Locked' },
  { value: 'DELETED', label: 'Deleted' },
]

const STATUS_COLOR: Record<UserStatus, string> = {
  ACTIVE: 'green',
  PENDING: 'yellow',
  LOCKED: 'red',
  DELETED: 'gray',
}

// ── User Form Modal ──────────────────────────────────────────────

interface UserModalProps {
  opened: boolean
  onClose: () => void
  editItem?: UserItem | null
}

function UserModal({ opened, onClose, editItem }: UserModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const { data: allRoles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.search(),
    staleTime: 60_000,
  })

  const { data: allDepts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    staleTime: 60_000,
  })

  const roleOptions = allRoles.map((r) => ({ value: String(r.id), label: r.name }))
  const deptOptions = allDepts.map((d) => ({
    value: String(d.id),
    label: d.path ? `${d.path} / ${d.name}` : d.name,
  }))

  const form = useForm<{
    username: string
    password: string
    email: string
    status: UserStatus
    roleIds: string[]
    deptId: string | null
    isDepartmentOwner: boolean
  }>({
    initialValues: {
      username: '',
      password: '',
      email: '',
      status: 'ACTIVE',
      roleIds: [],
      deptId: null,
      isDepartmentOwner: false,
    },
    validate: {
      username: (v) => (!v?.trim() ? 'Username is required' : null),
      password: (v, _values) =>
        !isEdit && !v?.trim() ? 'Password is required' : null,
      email: (v) => {
        if (!v?.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Invalid email'
        return null
      },
      roleIds: (v) => (!v?.length ? 'At least one role is required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({
          username: editItem.username,
          password: '',
          email: editItem.email,
          status: editItem.status,
          roleIds: [],   // roles from search are strings; we can't map back to ids easily
          deptId: null,
          isDepartmentOwner: editItem.isDepartmentOwner ?? false,
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem])

  // Khi edit: fetch full detail để lấy roleIds và deptId
  useEffect(() => {
    if (opened && editItem) {
      usersApi.getById(editItem.id).then((detail) => {
        const matchedRoleIds = allRoles
          .filter((r) => detail.roles?.includes(r.name))
          .map((r) => String(r.id))
        const matchedDept = allDepts.find((d) => d.code === detail.deptCode)
        form.setValues((prev) => ({
          ...prev,
          roleIds: matchedRoleIds,
          deptId: matchedDept ? String(matchedDept.id) : null,
        }))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem, allRoles, allDepts])

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notifications.show({ message: 'User created successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notifications.show({ message: 'User updated successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: typeof form.values) {
    const roleIds = values.roleIds.map(Number)
    const deptId = values.deptId ? Number(values.deptId) : null

    if (isEdit) {
      updateMutation.mutate({
        username: values.username,
        email: values.email,
        status: values.status,
        roleIds,
        deptId,
        isDepartmentOwner: values.isDepartmentOwner,
      })
    } else {
      createMutation.mutate({
        username: values.username,
        password: values.password,
        email: values.email,
        status: values.status,
        roleIds,
        deptId,
        isDepartmentOwner: values.isDepartmentOwner,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit User' : 'Add User'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Username"
            placeholder="e.g. john.doe"
            withAsterisk
            {...form.getInputProps('username')}
          />
          {!isEdit && (
            <PasswordInput
              label="Password"
              placeholder="Min 6 characters"
              withAsterisk
              {...form.getInputProps('password')}
            />
          )}
          <TextInput
            label="Email"
            placeholder="e.g. john@example.com"
            withAsterisk
            {...form.getInputProps('email')}
          />
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            {...form.getInputProps('status')}
          />
          <MultiSelect
            label="Roles"
            placeholder="Select roles..."
            data={roleOptions}
            searchable
            withAsterisk
            {...form.getInputProps('roleIds')}
          />
          <Select
            label="Department"
            placeholder="— No department —"
            data={deptOptions}
            searchable
            clearable
            {...form.getInputProps('deptId')}
          />
          <Checkbox
            label="Department Owner"
            {...form.getInputProps('isDepartmentOwner', { type: 'checkbox' })}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

// ── Main Page ────────────────────────────────────────────────────

const PAGE_SIZE = 10

export function UserPage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<UserItem | null>(null)

  // Filters
  const [usernameInput, setUsernameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [deptId, setDeptId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  const [username] = useDebouncedValue(usernameInput, 300)
  const [email] = useDebouncedValue(emailInput, 300)

  const { data: allDepts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    staleTime: 60_000,
  })

  const deptOptions = allDepts.map((d) => ({
    value: String(d.id),
    label: d.path ? `${d.path} / ${d.name}` : d.name,
  }))

  // Reset về trang 1 khi filter hoặc sort thay đổi
  useEffect(() => { setPage(1) }, [username, email, status, deptId, sorting])

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['users', { username, email, status, deptId, page, sort }],
    queryFn: () =>
      usersApi.search({
        username: username || undefined,
        email: email || undefined,
        status: (status as UserStatus) || undefined,
        deptId: deptId ? Number(deptId) : undefined,
        page: page - 1,
        size: PAGE_SIZE,
        sort: sort.length ? sort : undefined,
      }),
  })

  const users: UserItem[] = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
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
    {
      id: 'id',
      header: 'ID',
      width: 70,
      align: 'center',
      cell: (row) => row.id,
    },
    {
      id: 'username',
      header: 'Username',
      enableSorting: true,
      accessorFn: (row) => row.username,
      cell: (row) => <Text fw={500}>{row.username}</Text>,
    },
    {
      id: 'email',
      header: 'Email',
      enableSorting: true,
      accessorFn: (row) => row.email,
      cell: (row) => <Text>{row.email}</Text>,
    },
    {
      id: 'status',
      header: 'Status',
      width: 100,
      align: 'center',
      enableSorting: true,
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
      cell: (row) => (
        <Group gap={4} wrap="wrap">
          {row.roles?.length ? (
            row.roles.map((r) => (
              <Badge key={r} size="xs" variant="light" color="blue">
                {r}
              </Badge>
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
      cell: (row) => (
        <Text c={row.deptName ? undefined : 'dimmed'}>
          {row.deptName ?? '—'}
        </Text>
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
    <Stack gap="md">
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
        toolbar={
          <Group gap="sm" wrap="nowrap">
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
              Add New
            </Button>
            <TextInput
              placeholder="Username..."
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.currentTarget.value)}
              w={150}
            />
            <TextInput
              placeholder="Email..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.currentTarget.value)}
              w={170}
            />
            <Select
              placeholder="All statuses"
              data={STATUS_OPTIONS}
              value={status || null}
              onChange={(v) => setStatus((v as UserStatus) ?? '')}
              clearable
              w={130}
            />
            <Select
              placeholder="All departments"
              data={deptOptions}
              value={deptId}
              onChange={setDeptId}
              searchable
              clearable
              w={180}
            />
          </Group>
        }
        footer={
          totalPages > 1 && (
            <Group justify="flex-end">
              <Pagination
                size="sm"
                total={totalPages}
                value={page}
                onChange={setPage}
              />
            </Group>
          )
        }
      />

      <UserModal opened={modalOpened} onClose={closeModal} editItem={editItem} />
    </Stack>
  )
}
