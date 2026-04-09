import { useEffect } from 'react'
import { Button, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { notifyError } from '@/lib/notify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'
import type { AssigneeTemplate } from '@/types/workflow'

const ASSIGNEE_TYPE_OPTIONS = [
  { value: 'ROLE', label: 'Role' },
  { value: 'USER', label: 'User' },
  { value: 'DEPT_OWNER', label: 'Department owner' },
]

interface Props {
  opened: boolean
  onClose: () => void
  stepId: number
  flowId: number
  assignee?: AssigneeTemplate
}

export function AssigneeModal({ opened, onClose, stepId, flowId, assignee }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!assignee

  const form = useForm({
    initialValues: { assigneeType: 'ROLE', assigneeValue: '' },
    validate: {
      assigneeType: (v) => (!v ? 'Required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      form.setValues({
        assigneeType: assignee?.assigneeType ?? 'ROLE',
        assigneeValue: assignee?.assigneeValue ?? '',
      })
    }
  }, [opened])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-flows', flowId] })

  const addMutation = useMutation({
    mutationFn: () =>
      adminFlowsApi.addAssignee(stepId, {
        assigneeType: form.values.assigneeType as never,
        assigneeValue: form.values.assigneeValue,
      }),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Assignee added', color: 'green' })
      form.reset()
      onClose()
    },
    onError: (error) => notifyError(error),
  })

  const editMutation = useMutation({
    mutationFn: async () => {
      await adminFlowsApi.deleteAssignee(assignee!.id)
      return adminFlowsApi.addAssignee(stepId, {
        assigneeType: form.values.assigneeType as never,
        assigneeValue: form.values.assigneeValue,
      })
    },
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Assignee updated', color: 'green' })
      form.reset()
      onClose()
    },
    onError: (error) => notifyError(error),
  })

  const isPending = addMutation.isPending || editMutation.isPending

  function handleClose() {
    form.reset()
    onClose()
  }

  const assigneeValueLabel = {
    ROLE: 'Role name',
    USER: 'Username',
    DEPT_OWNER: 'Manager role name (optional)',
  }[form.values.assigneeType]

  return (
    <Modal opened={opened} onClose={handleClose} title={isEdit ? 'Edit Assignee' : 'Add Assignee'} centered>
      <form onSubmit={form.onSubmit(() => (isEdit ? editMutation.mutate() : addMutation.mutate()))}>
        <Stack>
          <Select
            label="Assignee type"
            data={ASSIGNEE_TYPE_OPTIONS}
            {...form.getInputProps('assigneeType')}
          />
          <TextInput
            label={assigneeValueLabel}
            placeholder="e.g. MANAGER or john.doe"
            {...form.getInputProps('assigneeValue')}
          />
          <Button type="submit" loading={isPending}>
            {isEdit ? 'Save changes' : 'Add'}
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
