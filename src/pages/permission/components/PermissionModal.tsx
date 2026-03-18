import {
  permissionsApi,
  type CreatePermissionPayload,
  type UpdatePermissionPayload,
} from '@/api/permissions.api'
import { notifyError } from '@/lib/notify'
import type { PermissionItem } from '@/types/api'
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export interface PermissionModalProps {
  opened: boolean
  onClose: () => void
  editItem?: PermissionItem | null
}

export function PermissionModal({ opened, onClose, editItem }: PermissionModalProps) {
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
