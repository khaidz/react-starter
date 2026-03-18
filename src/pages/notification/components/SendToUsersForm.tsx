import { notificationsApi } from '@/api/notifications.api'
import { usersApi } from '@/api/users.api'
import { notifyError } from '@/lib/notify'
import { Button, MultiSelect, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconSend } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'

const TYPE_OPTIONS = [
  { value: 'SYSTEM',  label: 'System' },
  { value: 'COMMENT', label: 'Comment' },
]

export function SendToUsersForm() {
  const form = useForm({
    initialValues: {
      recipients: [] as string[],
      type: 'SYSTEM',
      title: '',
      body: '',
      targetUrl: '',
    },
    validate: {
      recipients: (v) => (v.length === 0 ? 'Select at least one recipient' : null),
      title:      (v) => (!v.trim() ? 'Title is required' : null),
    },
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => usersApi.search({ size: 200 }),
  })

  const userOptions = (usersData?.content ?? []).map((u) => ({
    value: u.username,
    label: u.username,
  }))

  const mutation = useMutation({
    mutationFn: () =>
      notificationsApi.sendToUsers({
        recipients: form.values.recipients,
        notification: {
          recipient: '',
          type:      form.values.type,
          title:     form.values.title,
          body:      form.values.body      || undefined,
          targetUrl: form.values.targetUrl || undefined,
        },
      }),
    onSuccess: () => {
      notifications.show({ message: `Sent to ${form.values.recipients.length} user(s)`, color: 'green' })
      form.reset()
    },
    onError: (e) => notifyError(e),
  })

  return (
    <form onSubmit={form.onSubmit(() => mutation.mutate(undefined))}>
      <Stack>
        <MultiSelect
          label="Recipients"
          placeholder="Select users"
          data={userOptions}
          searchable
          required
          {...form.getInputProps('recipients')}
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
          Send to {form.values.recipients.length > 0 ? form.values.recipients.length : ''} user{form.values.recipients.length !== 1 ? 's' : ''}
        </Button>
      </Stack>
    </form>
  )
}
