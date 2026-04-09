import { Button, Modal, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { notifyError } from '@/lib/notify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'

interface Props {
  opened: boolean
  onClose: () => void
  onCreated?: (id: number) => void
}

export function CreateFlowModal({ opened, onClose, onCreated }: Props) {
  const queryClient = useQueryClient()
  const form = useForm({
    initialValues: { code: '', name: '' },
    validate: {
      code: (v) =>
        !v
          ? 'Required'
          : !/^[A-Z0-9_]+$/.test(v)
            ? 'Only uppercase letters, digits and underscores'
            : null,
      name: (v) => (!v ? 'Required' : null),
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: adminFlowsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      notifications.show({ message: 'Flow created', color: 'green' })
      if (data?.id) onCreated?.(data.id)
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
    <Modal opened={opened} onClose={handleClose} title="New Flow" centered>
      <form onSubmit={form.onSubmit((v) => mutate(v))}>
        <Stack>
          <TextInput
            label="Flow Code"
            placeholder="e.g. LOAN_APPROVAL"
            description="Uppercase letters, digits and underscores only"
            {...form.getInputProps('code')}
          />
          <TextInput
            label="Flow Name"
            placeholder="e.g. Loan Approval Process"
            {...form.getInputProps('name')}
          />
          <Button type="submit" loading={isPending}>
            Create Flow
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
