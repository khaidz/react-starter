import { jobsApi } from '@/api/jobs.api'
import { notifyError } from '@/lib/notify'
import type { JobItem } from '@/types/api'
import { ActionIcon, Badge, Card, Group, Stack, Switch, Text, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconHistory, IconPlayerPlay } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CronEditor } from './CronEditor'
import { JobLogModal } from './JobLogModal'
import { STATUS_COLOR, formatDuration, formatRelative } from '../utils'

interface JobCardProps {
  job: JobItem
}

export function JobCard({ job }: JobCardProps) {
  const queryClient = useQueryClient()
  const [logsOpened, { open: openLogs, close: closeLogs }] = useDisclosure(false)

  const triggerMutation = useMutation({
    mutationFn: () => jobsApi.trigger(job.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      notifications.show({ message: `Job "${job.name}" triggered`, color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const toggleMutation = useMutation({
    mutationFn: () => jobsApi.toggle(job.name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
    onError: (error) => notifyError(error),
  })

  const { lastRun } = job
  const duration = formatDuration(lastRun?.startedAt, lastRun?.endedAt)

  return (
    <>
      <Card withBorder padding="md" radius="sm">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={8} align="center">
              <Text fw={600} size="sm">{job.name}</Text>
              <CronEditor jobName={job.name} cron={job.cron} />
            </Group>
            {job.description && <Text size="xs" c="dimmed">{job.description}</Text>}
            <Group gap={6} mt={4} align="center">
              {lastRun ? (
                <>
                  <Badge size="xs" variant="light" color={STATUS_COLOR[lastRun.status]}>{lastRun.status}</Badge>
                  <Text size="xs" c="dimmed">{formatRelative(lastRun.startedAt)}</Text>
                  {duration && <Text size="xs" c="dimmed">· {duration}</Text>}
                  {lastRun.triggeredBy === 'MANUAL' && (
                    <Badge size="xs" variant="dot" color="violet">manual</Badge>
                  )}
                </>
              ) : (
                <Text size="xs" c="dimmed" fs="italic">No runs yet</Text>
              )}
            </Group>
          </Stack>

          <Group gap={8} align="center" wrap="nowrap">
            <Switch
              size="sm"
              checked={job.enabled}
              onChange={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              label={<Text size="xs" c={job.enabled ? undefined : 'dimmed'}>{job.enabled ? 'Enabled' : 'Disabled'}</Text>}
            />
            <Tooltip label="Trigger now" withArrow>
              <ActionIcon
                size="sm"
                variant="light"
                color="blue"
                loading={triggerMutation.isPending}
                onClick={() => triggerMutation.mutate()}
              >
                <IconPlayerPlay size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="View logs" withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={openLogs}>
                <IconHistory size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>

      <JobLogModal jobName={job.name} opened={logsOpened} onClose={closeLogs} />
    </>
  )
}
