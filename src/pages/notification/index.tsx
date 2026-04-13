import { notificationsApi } from '@/api/notifications.api'
import type { BroadcastPayload, SendToUserPayload } from '@/api/notifications.api'
import { notifyError } from '@/lib/notify'
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  MultiSelect,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconBell,
  IconInfoCircle,
  IconSend,
  IconSpeakerphone,
  IconUsers,
} from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users.api'

const TYPE_OPTIONS = [
  { value: 'SYSTEM',  label: 'System' },
  { value: 'COMMENT', label: 'Comment' },
]

// ── Send to single user ───────────────────────────────────────────

function SendToUserForm() {
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
        <TextInput
          label="Recipient username"
          placeholder="e.g. john.doe"
          required
          {...form.getInputProps('recipient')}
        />
        <Select
          label="Type"
          data={TYPE_OPTIONS}
          {...form.getInputProps('type')}
        />
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
          placeholder="/workflow-runner (optional)"
          {...form.getInputProps('targetUrl')}
        />
        <Button
          type="submit"
          leftSection={<IconSend size={15} />}
          loading={mutation.isPending}
        >
          Send
        </Button>
      </Stack>
    </form>
  )
}

// ── Send to multiple users ────────────────────────────────────────

function SendToUsersForm() {
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
        <Select
          label="Type"
          data={TYPE_OPTIONS}
          {...form.getInputProps('type')}
        />
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
          placeholder="/workflow-runner (optional)"
          {...form.getInputProps('targetUrl')}
        />
        <Button
          type="submit"
          leftSection={<IconSend size={15} />}
          loading={mutation.isPending}
        >
          Send to {form.values.recipients.length > 0 ? form.values.recipients.length : ''} user{form.values.recipients.length !== 1 ? 's' : ''}
        </Button>
      </Stack>
    </form>
  )
}

// ── Broadcast ─────────────────────────────────────────────────────

function BroadcastForm() {
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
        <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
          Broadcast chỉ push realtime qua WebSocket — <strong>không lưu DB</strong>. Chỉ user đang online mới nhận được.
        </Alert>
        <Select
          label="Type"
          data={TYPE_OPTIONS}
          {...form.getInputProps('type')}
        />
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
          placeholder="/workflow-runner (optional)"
          {...form.getInputProps('targetUrl')}
        />
        <Button
          type="submit"
          color="orange"
          leftSection={<IconSpeakerphone size={15} />}
          loading={mutation.isPending}
        >
          Broadcast to all
        </Button>
      </Stack>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export function NotificationAdminPage() {
  return (
    <Stack gap="md">
      <Group>
        <Title order={3}>Notification Management</Title>
        <Badge variant="light" color="blue" leftSection={<IconBell size={12} />}>Admin</Badge>
      </Group>

      <Card withBorder p={0}>
        <Tabs defaultValue="user" variant="outline">
          <Tabs.List px="md" pt="xs">
            <Tabs.Tab value="user"  leftSection={<IconSend size={14} />}>Send to User</Tabs.Tab>
            <Tabs.Tab value="users" leftSection={<IconUsers size={14} />}>Send to Users</Tabs.Tab>
            <Tabs.Tab value="broadcast" leftSection={<IconSpeakerphone size={14} />}>Broadcast</Tabs.Tab>
          </Tabs.List>

          <Divider />

          <Tabs.Panel value="user" p="md">
            <Text size="sm" c="dimmed" mb="md">Gửi notification tới một user cụ thể, lưu vào DB.</Text>
            <SendToUserForm />
          </Tabs.Panel>

          <Tabs.Panel value="users" p="md">
            <Text size="sm" c="dimmed" mb="md">Gửi notification tới nhiều user, lưu vào DB.</Text>
            <SendToUsersForm />
          </Tabs.Panel>

          <Tabs.Panel value="broadcast" p="md">
            <Text size="sm" c="dimmed" mb="md">Push realtime tới tất cả user đang kết nối WebSocket.</Text>
            <BroadcastForm />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Stack>
  )
}
