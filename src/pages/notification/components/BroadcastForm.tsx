import { notificationsApi, type BroadcastPayload } from '@/api/notifications.api'
import { notifyError } from '@/lib/notify'
import { Alert, Button, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconInfoCircle, IconSpeakerphone } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'

const TYPE_OPTIONS = [
  { value: 'SYSTEM',  label: 'System' },
  { value: 'COMMENT', label: 'Comment' },
]

export function BroadcastForm() {
  const form = useForm<BroadcastPayload>({
    initialValues: { type: 'SYSTEM', title: '', body: '', targetUrl: '' },
    validate: {
      title: (v) => (!v.trim() ? 'Title is required' : null),
    },
  })

  const mutation = useMutation({
    mutationFn: (values: BroadcastPayload) =>
      notificationsApi.broadcast({
        ...values,
        body:      values.body      || undefined,
        targetUrl: values.targetUrl || undefined,
      }),
    onSuccess: () => {
      notifications.show({ message: 'Broadcast sent to all online users', color: 'green' })
      form.reset()
    },
    onError: (e) => notifyError(e),
  })

  return (
    <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
      <Stack>
        <Alert icon={<IconInfoCircle size={16} />} variant="light">
          Broadcast chỉ push realtime qua WebSocket — <strong>không lưu DB</strong>. Chỉ user đang online mới nhận được.
        </Alert>
        <Select label="Type" data={TYPE_OPTIONS} {...form.getInputProps('type')} />
        <TextInput
          label="Title"
          placeholder="Broadcast title"
          required
          {...form.getInputProps('title')}
        />
        <Textarea
          label="Body"
          placeholder="Broadcast content (optional)"
          rows={3}
          {...form.getInputProps('body')}
        />
        <TextInput
          label="Target URL"
          placeholder="https://... (optional)"
          {...form.getInputProps('targetUrl')}
        />
        <Button
          type="submit"
          leftSection={<IconSpeakerphone size={15} />}
          loading={mutation.isPending}
        >
          Broadcast to all
        </Button>
      </Stack>
    </form>
  )
}
