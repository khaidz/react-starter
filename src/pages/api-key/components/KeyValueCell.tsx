import { ActionIcon, Code, CopyButton, Group, Tooltip } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'

export function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function KeyValueCell({ value }: { value: string }) {
  const masked = value.slice(0, 10) + '•'.repeat(16)
  return (
    <Group gap={6} wrap="nowrap">
      <Code fz="xs" style={{ letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
        {masked}
      </Code>
      <CopyButton value={value} timeout={1500}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy key'} withArrow>
            <ActionIcon size="xs" variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
              {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  )
}
