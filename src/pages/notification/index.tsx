import { Badge, Card, Divider, Group, Stack, Tabs, Text, Title } from '@mantine/core'
import { IconBell, IconSend, IconSpeakerphone, IconUsers } from '@tabler/icons-react'
import { BroadcastForm } from './components/BroadcastForm'
import { SendToUserForm } from './components/SendToUserForm'
import { SendToUsersForm } from './components/SendToUsersForm'

export function NotificationAdminPage() {
  return (
    <>
    <title>Notification Management</title>
    <Stack gap="md">
      <Group>
        <Title order={3}>Notification Management</Title>
        <Badge variant="light" color="blue" leftSection={<IconBell size={12} />}>Admin</Badge>
      </Group>

      <Card withBorder p={0}>
        <Tabs defaultValue="user" variant="outline">
          <Tabs.List px="md" pt="xs">
            <Tabs.Tab value="user"      leftSection={<IconSend size={14} />}>Send to User</Tabs.Tab>
            <Tabs.Tab value="users"     leftSection={<IconUsers size={14} />}>Send to Users</Tabs.Tab>
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
    </>
  )
}
