import { rolesApi, type CreateRolePayload, type UpdateRolePayload } from '@/api/roles.api'
import { permissionsApi } from '@/api/permissions.api'
import { notifyError } from '@/lib/notify'
import type { RoleItem } from '@/types/api'
import { Button, Group, Modal, MultiSelect, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export interface RoleModalProps {
  opened: boolean
  onClose: () => void
  editItem?: RoleItem | null
}

export function RoleModal({ opened, onClose, editItem }: RoleModalProps) {
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
    const payload = { name: values.name, description: values.description, permissionIds: values.permissionIds }
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
