import { departmentsApi, type CreateDepartmentPayload, type UpdateDepartmentPayload } from '@/api/departments.api'
import { notifyError } from '@/lib/notify'
import type { DepartmentItem } from '@/types/api'
import { Button, Checkbox, Group, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export interface DepartmentModalProps {
  opened: boolean
  onClose: () => void
  editItem?: DepartmentItem | null
}

export function DepartmentModal({ opened, onClose, editItem }: DepartmentModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const { data: allDepts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    staleTime: 60_000,
  })

  const parentOptions = allDepts
    .filter((d) => d.id !== editItem?.id)
    .map((d) => ({
      value: String(d.id),
      label: d.name,
    }))

  const form = useForm<{
    name: string
    code: string
    description: string
    parentId: string | null
    isActive: boolean
  }>({
    initialValues: { name: '', code: '', description: '', parentId: null, isActive: true },
    validate: {
      name: (v) => (!v?.trim() ? 'Department name is required' : null),
      code: (v) => (!v?.trim() ? 'Department code is required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({
          name: editItem.name,
          code: editItem.code,
          description: editItem.description ?? '',
          parentId: editItem.parent?.id != null ? String(editItem.parent.id) : null,
          isActive: editItem.active,
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => departmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      notifications.show({ message: 'Department created successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) => departmentsApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      notifications.show({ message: 'Department updated successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: typeof form.values) {
    if (isEdit) {
      updateMutation.mutate({
        parentId: values.parentId ?? null,
        name: values.name,
        code: values.code,
        isActive: values.isActive,
      })
    } else {
      createMutation.mutate({
        parentId: values.parentId,
        name: values.name,
        code: values.code,
        description: values.description,
        isActive: values.isActive,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit Department' : 'Add Department'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Parent Department"
            placeholder="— Root (no parent) —"
            data={parentOptions}
            searchable
            clearable
            {...form.getInputProps('parentId')}
          />
          <TextInput
            label="Department Name"
            placeholder="e.g. Engineering"
            withAsterisk
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Department Code"
            placeholder="e.g. ENG"
            withAsterisk
            {...form.getInputProps('code')}
          />
          {!isEdit && (
            <TextInput
              label="Description"
              placeholder="Brief description"
              {...form.getInputProps('description')}
            />
          )}
          <Checkbox label="Active" {...form.getInputProps('isActive', { type: 'checkbox' })} />
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
