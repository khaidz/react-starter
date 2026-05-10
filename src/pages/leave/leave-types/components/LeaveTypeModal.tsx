import { leaveTypesApi, type CreateLeaveTypePayload } from '@/api/leave-types.api'
import { notifyError } from '@/lib/notify'
import type { LeaveTypeItem } from '@/types/api'
import { Button, Group, Modal, NumberInput, Stack, Switch, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

interface Props {
  opened: boolean
  onClose: () => void
  editItem: LeaveTypeItem | null
}

export function LeaveTypeModal({ opened, onClose, editItem }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const form = useForm<CreateLeaveTypePayload>({
    initialValues: { name: '', description: '', maxDaysPerYear: 12, isPaid: true, isActive: true },
    validate: {
      name: (v) => (!v?.trim() ? 'Name is required' : null),
      maxDaysPerYear: (v) => (v < 0 ? 'Must be >= 0' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({
          name: editItem.name,
          description: editItem.description ?? '',
          maxDaysPerYear: editItem.maxDaysPerYear,
          isPaid: editItem.isPaid,
          isActive: editItem.isActive,
        })
      } else {
        form.reset()
      }
    }
  }, [opened, editItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreateLeaveTypePayload) => leaveTypesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] })
      notifications.show({ message: 'Leave type created', color: 'green' })
      handleClose()
    },
    onError: (e) => notifyError(e),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateLeaveTypePayload) => leaveTypesApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] })
      notifications.show({ message: 'Leave type updated', color: 'green' })
      handleClose()
    },
    onError: (e) => notifyError(e),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: CreateLeaveTypePayload) {
    if (isEdit) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal opened={opened} onClose={handleClose} title={isEdit ? 'Edit Leave Type' : 'Add Leave Type'} centered size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput label="Name" placeholder="Annual Leave" {...form.getInputProps('name')} />
          <Textarea label="Description" placeholder="Description..." rows={2} {...form.getInputProps('description')} />
          <NumberInput label="Max Days Per Year" min={0} {...form.getInputProps('maxDaysPerYear')} />
          <Group>
            <Switch label="Paid Leave" {...form.getInputProps('isPaid', { type: 'checkbox' })} />
            <Switch label="Active" {...form.getInputProps('isActive', { type: 'checkbox' })} />
          </Group>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose}>Cancel</Button>
            <Button type="submit" loading={isPending}>{isEdit ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
