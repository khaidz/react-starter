import {
  permissionsApi,
  type CreatePermissionPayload,
  type UpdatePermissionPayload,
} from '@/api/permissions.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { PermissionItem } from '@/types/api'
import {
  ActionIcon,
  Button,
  Group,
  Modal,
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

// ── Permission Form Modal ────────────────────────────────────────

interface PermissionModalProps {
  opened: boolean
  onClose: () => void
  editItem?: PermissionItem | null
}

function PermissionModal({ opened, onClose, editItem }: PermissionModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const form = useForm<CreatePermissionPayload>({
    initialValues: { name: '', description: '' },
    validate: {
      name: (v) => (!v?.trim() ? 'Permission name is required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({ name: editItem.name, description: editItem.description ?? '' })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreatePermissionPayload) => permissionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      notifications.show({ message: 'Permission created successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePermissionPayload) => permissionsApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      notifications.show({ message: 'Permission updated successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: CreatePermissionPayload) {
    if (isEdit) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit Permission' : 'Add Permission'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Permission Name"
            placeholder="e.g. user:create"
            withAsterisk
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Description"
            placeholder="Brief description of this permission"
            {...form.getInputProps('description')}
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

export function PermissionPage() {
  const queryClient = useQueryClient()
  const [search] = useState('')
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<PermissionItem | null>(null)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['permissions', search],
    queryFn: () => permissionsApi.search({ name: search || undefined }),
  })

  const permissions: PermissionItem[] = data ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: number) => permissionsApi.delete(id),
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
    {
      id: 'id',
      header: 'ID',
      width: 80,
      align: 'center',
      cell: (row) => row.id,
    },
    {
      id: 'name',
      header: 'Permission Name',
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
        <Title order={3}>Permission Management</Title>
      </Group>

      <DataTable
        columns={columns}
        data={permissions}
        keyField="id"
        loading={isLoading}
        emptyText="No permissions found"
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

      <PermissionModal opened={modalOpened} onClose={closeModal} editItem={editItem} />
    </Stack>
  )
}
