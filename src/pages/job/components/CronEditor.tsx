import { jobsApi } from '@/api/jobs.api'
import { notifyError } from '@/lib/notify'
import { ActionIcon, Badge, Group, TextInput, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconClockEdit, IconX } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface CronEditorProps {
  jobName: string
  cron: string
}

export function CronEditor({ jobName, cron }: CronEditorProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(cron)

  const mutation = useMutation({
    mutationFn: () => jobsApi.updateCron(jobName, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      notifications.show({ message: 'Schedule updated', color: 'green' })
      setEditing(false)
    },
    onError: (error) => notifyError(error),
  })

  if (!editing) {
    return (
      <Group gap={4} align="center">
        <Badge size="xs" variant="outline" color="gray" style={{ fontFamily: 'monospace' }}>{cron}</Badge>
        <Tooltip label="Edit schedule" withArrow>
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => { setValue(cron); setEditing(true) }}>
            <IconClockEdit size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>
    )
  }

  return (
    <Group gap={4} align="center" wrap="nowrap">
      <TextInput
        size="xs"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder="0/60 * * * * *"
        style={{ width: 160, fontFamily: 'monospace' }}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') mutation.mutate()
          if (e.key === 'Escape') setEditing(false)
        }}
      />
      <ActionIcon size="xs" variant="light" color="green" loading={mutation.isPending} onClick={() => mutation.mutate()}>
        <IconCheck size={12} />
      </ActionIcon>
      <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setEditing(false)}>
        <IconX size={12} />
      </ActionIcon>
    </Group>
  )
}
