import { useState } from 'react'
import { Anchor, ActionIcon, Badge, Divider, Group, Loader, Stack, Text, Tooltip } from '@mantine/core'
import { IconDownload, IconEye, IconPaperclip } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { workflowApi } from '@/api/workflow.api'
import { fileApi } from '@/api/file.api'
import { notifyError } from '@/lib/notify'
import type { WorkflowAttachment } from '@/types/workflow'

export function attachmentLabel(a: WorkflowAttachment) {
  return a.originalName ?? a.fileKey
}

export function AttachmentRow({ a }: { a: WorkflowAttachment }) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await fileApi.download(a.fileKey, a.originalName ?? undefined)
    } catch (err) {
      notifyError(err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Group gap={6} align="center" wrap="nowrap">
      <IconPaperclip size={12} style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }} />

      <Anchor
        size="xs"
        style={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }}
        onClick={handleDownload}
      >
        {attachmentLabel(a)}
      </Anchor>

      {a.sizeReadable && (
        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
          {a.sizeReadable}
        </Text>
      )}

      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
        by {a.uploadedBy}
      </Text>

      <Tooltip label="Preview" withArrow>
        <ActionIcon
          size="xs"
          variant="subtle"
          component="a"
          href={fileApi.previewUrl(a.fileKey)}
          target="_blank"
        >
          <IconEye size={12} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Download" withArrow>
        <ActionIcon
          size="xs"
          variant="subtle"
          loading={downloading}
          onClick={handleDownload}
        >
          <IconDownload size={12} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}

interface Props {
  workflowInstanceId: number
}

export function AttachmentsPanel({ workflowInstanceId }: Props) {
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['workflow-attachments', workflowInstanceId],
    queryFn: () => workflowApi.getAttachments(workflowInstanceId),
  })

  if (isLoading) return <Loader size="xs" />

  if (attachments.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        No attachments.
      </Text>
    )
  }

  // Nhóm: null stepInstanceId → "Workflow" (đính kèm lúc start)
  // Còn lại nhóm theo stepInstanceId
  const groups = new Map<string, { label: string; items: WorkflowAttachment[] }>()

  for (const a of attachments) {
    const key = a.stepInstanceId == null ? '__start__' : String(a.stepInstanceId)
    if (!groups.has(key)) {
      groups.set(key, {
        label: a.stepInstanceId == null ? 'Workflow (initial)' : (a.stepName ?? `Step ${a.stepInstanceId}`),
        items: [],
      })
    }
    groups.get(key)!.items.push(a)
  }

  const entries = Array.from(groups.entries())

  return (
    <Stack gap={10}>
      {entries.map(([key, group], idx) => (
        <div key={key}>
          {idx > 0 && <Divider mb={8} />}
          <Group gap={6} mb={4} align="center">
            <Text size="xs" fw={600}>
              {group.label}
            </Text>
            <Badge size="xs" variant="light" color="gray">
              {group.items.length}
            </Badge>
          </Group>
          <Stack gap={4} pl={4}>
            {group.items.map((a) => (
              <AttachmentRow key={a.id} a={a} />
            ))}
          </Stack>
        </div>
      ))}
    </Stack>
  )
}
