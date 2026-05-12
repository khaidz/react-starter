import { notificationsApi, type SendToUserPayload } from '@/api/notifications.api'
import { usersApi } from '@/api/users.api'
import { notifyError } from '@/lib/notify'
import { Button, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconSend } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'

const TYPE_OPTIONS = [
  { value: 'SYSTEM',  label: 'System' },
  { value: 'COMMENT', label: 'Comment' },
]

export function SendToUserForm() {
  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => usersApi.search({ size: 200 }),
    staleTime: 60_000,
  })

  const userOptions = (usersData?.content ?? []).map((u) => ({
    value: u.username,
    label: `${u.username} — ${u.email}`,
  }))

  const form = useForm<SendToUserPayload>({
    initialValues: { recipient: '', type: 'SYSTEM', title: '', body: '', targetUrl: '' },
    validate: {
      recipient: (v) => (!v.trim() ? 'Recipient is required' : null),
      title:     (v) => (!v.trim() ? 'Title is required' : null),
    },
  })

  const mutation = useMutation({
    mutationFn: (values: SendToUserPayload) =>
      notificationsApi.sendToUser({
        ...values,
        body:      values.body      || undefined,
        targetUrl: values.targetUrl || undefined,
      }),
    onSuccess: () => {
      notifications.show({ message: 'Notification sent', color: 'green' })
      form.reset()
    },
    onError: (e) => notifyError(e),
  })

  return (
    <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
      <Stack>
        <Select
          label="Recipient username"
          placeholder="Search by username..."
          required
          searchable
          data={userOptions}
          nothingFoundMessage="No users found"
          {...form.getInputProps('recipient')}
        />
        <Select label="Type" data={TYPE_OPTIONS} {...form.getInputProps('type')} />
        <TextInput
          label="Title"
          placeholder="Notification title"
          required
          {...form.getInputProps('title')}
        />
        <Textarea
          label="Body"
          placeholder="Notification content (optional)"
          rows={3}
          {...form.getInputProps('body')}
        />
        <TextInput
          label="Target URL"
          placeholder="https://... (optional)"
          {...form.getInputProps('targetUrl')}
        />
        <Button type="submit" leftSection={<IconSend size={15} />} loading={mutation.isPending}>
          Send
        </Button>
      </Stack>
    </form>
  )
}
