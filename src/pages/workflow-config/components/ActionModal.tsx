import { Button, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { notifyError } from '@/lib/notify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'

export const ACTION_TYPE_OPTIONS = [
  { value: 'START', label: 'Start' },
  { value: 'SUBMIT', label: 'Submit' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'REJECT', label: 'Reject' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'EDIT_REQUEST', label: 'Edit Request' },
  { value: 'PICKUP', label: 'Pick Up' },
  { value: 'SHARE', label: 'Share' },
  { value: 'FINISH', label: 'Finish' },
  { value: 'CANCEL', label: 'Cancel' },
  { value: 'ADD_ASSIGNEE', label: 'Add Assignee' },
]

interface Props {
  opened: boolean
  onClose: () => void
  stepId: number
  flowId: number
}

export function ActionModal({ opened, onClose, stepId, flowId }: Props) {
  const queryClient = useQueryClient()
  const form = useForm({
    initialValues: { actionType: '', name: '' },
    validate: {
      actionType: (v) => (!v ? 'Required' : null),
      name: (v) => (!v ? 'Required' : null),
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      adminFlowsApi.addAction(stepId, {
        actionType: form.values.actionType as never,
        name: form.values.name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flows', flowId] })
      notifications.show({ message: 'Action added', color: 'green' })
      form.reset()
      onClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Add Action" centered>
      <form onSubmit={form.onSubmit(() => mutate())}>
        <Stack>
          <Select
            label="Action type"
            data={ACTION_TYPE_OPTIONS}
            placeholder="Select action type"
            {...form.getInputProps('actionType')}
            onChange={(value) => {
              form.setFieldValue('actionType', value ?? '')
              const label = ACTION_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? ''
              if (!form.values.name || ACTION_TYPE_OPTIONS.some((o) => o.label === form.values.name)) {
                form.setFieldValue('name', label)
              }
            }}
          />
          <TextInput
            label="Display name"
            placeholder="e.g. Approve document"
            {...form.getInputProps('name')}
          />
          <Button type="submit" loading={isPending}>
            Add
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
