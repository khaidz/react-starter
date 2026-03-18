import type { ApiKeyItem } from '@/types/api'
import { ActionIcon, Alert, Button, Code, CopyButton, Group, Modal, Stack, Text, Tooltip } from '@mantine/core'
import { IconAlertCircle, IconCheck, IconCopy } from '@tabler/icons-react'

export interface CreatedKeyModalProps {
  opened: boolean
  onClose: () => void
  apiKey: ApiKeyItem | null
}

export function CreatedKeyModal({ opened, onClose, apiKey }: CreatedKeyModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="API Key Created" centered size="md">
      <Stack>
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
          Copy your API key now — it will be masked after you close this dialog.
        </Alert>
        <Stack gap={4}>
          <Text size="sm" fw={500}>Key Name</Text>
          <Text size="sm">{apiKey?.name}</Text>
        </Stack>
        <Stack gap={4}>
          <Text size="sm" fw={500}>API Key</Text>
          <Group gap={8} wrap="nowrap">
            <Code
              block
              style={{ flex: 1, wordBreak: 'break-all', fontSize: '0.78rem', userSelect: 'all' }}
            >
              {apiKey?.keyValue}
            </Code>
            <CopyButton value={apiKey?.keyValue ?? ''} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
                  <ActionIcon
                    size="lg"
                    variant={copied ? 'filled' : 'light'}
                    color={copied ? 'green' : 'blue'}
                    onClick={copy}
                    style={{ flexShrink: 0 }}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Stack>
        <Group justify="flex-end" mt="xs">
          <Button onClick={onClose}>Done</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
