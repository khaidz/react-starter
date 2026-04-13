import { rolesApi, type CreateRolePayload, type UpdateRolePayload } from '@/api/roles.api'
import { permissionsApi } from '@/api/permissions.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { RoleItem } from '@/types/api'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  MultiSelect,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

// ── Role Form Modal ──────────────────────────────────────────────

interface RoleModalProps {
  opened: boolean
  onClose: () => void
  editItem?: RoleItem | null
}

function RoleModal({ opened, onClose, editItem }: RoleModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.search(),
    staleTime: 60_000,
  })

  const permissionOptions = allPermissions.map((p) => ({
    value: String(p.id),
    label: p.name,
  }))

  const form = useForm<{ name: string; description: string; permissionIds: string[] }>({
    initialValues: { name: '', description: '', permissionIds: [] },
    validate: {
      name: (v) => (!v?.trim() ? 'Role name is required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({
          name: editItem.name,
          description: editItem.description ?? '',
          permissionIds: (editItem.permissions ?? []).map((p) => String(p.id)),
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      notifications.show({ message: 'Role created successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateRolePayload) => rolesApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      notifications.show({ message: 'Role updated successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: { name: string; description: string; permissionIds: string[] }) {
    const payload = {
      name: values.name,
      description: values.description,
      permissionIds: values.permissionIds.map(Number),
    }
    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit Role' : 'Add Role'}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Role Name"
            placeholder="e.g. MANAGER"
            withAsterisk
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Description"
            placeholder="Brief description of this role"
            {...form.getInputProps('description')}
          />
          <MultiSelect
            label="Permissions"
            placeholder="Select permissions..."
            data={permissionOptions}
            searchable
            clearable
            {...form.getInputProps('permissionIds')}
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

export function RolePage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<RoleItem | null>(null)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.search(),
  })

  const roles: RoleItem[] = data ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
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

  const columns: TableColumn<RoleItem>[] = [
    {
      id: 'id',
      header: 'ID',
      width: 80,
      align: 'center',
      cell: (row) => row.id,
    },
    {
      id: 'name',
      header: 'Role Name',
      enableSorting: true,
      enableColumnFilter: true,
      accessorFn: (row) => row.name,
      filterPlaceholder: 'Search by name...',
      cell: (row) => <Text>{row.name}</Text>,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => (
        <Text c={row.description ? undefined : 'dimmed'}>{row.description || '—'}</Text>
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
            <Text size="sm" c="dimmed">—</Text>
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
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={3}>Role Management</Title>
      </Group>

      <DataTable
        columns={columns}
        data={roles}
        keyField="id"
        loading={isLoading}
        emptyText="No roles found"
        onRefresh={() => refetch()}
        refreshing={isFetching && !isLoading}
        toolbar={
          <Group gap="sm">
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
              Add New
            </Button>
          </Group>
        }
      />

      <RoleModal opened={modalOpened} onClose={closeModal} editItem={editItem} />
    </Stack>
  )
}
