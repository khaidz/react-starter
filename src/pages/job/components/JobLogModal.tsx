import { jobsApi } from '@/api/jobs.api'
import type { JobLogItem, PagedData } from '@/types/api'
import { Badge, Modal, Pagination, Stack, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { STATUS_COLOR, formatDateTime, formatDuration } from '../utils'

interface JobLogModalProps {
  jobName: string
  opened: boolean
  onClose: () => void
}

export function JobLogModal({ jobName, opened, onClose }: JobLogModalProps) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<PagedData<JobLogItem>>({
    queryKey: ['job-logs', jobName, page],
    queryFn: () => jobsApi.getLogs(jobName, page - 1, 10),
    enabled: opened,
  })

  const logs = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <Modal opened={opened} onClose={onClose} title={`Logs — ${jobName}`} size="xl" centered>
      <Stack gap="sm">
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={90}>Status</Table.Th>
              <Table.Th w={160}>Started</Table.Th>
              <Table.Th w={80}>Duration</Table.Th>
              <Table.Th w={100}>Triggered By</Table.Th>
              <Table.Th>Message</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
                  <Text size="sm" c="dimmed">Loading...</Text>
                </Table.Td>
              </Table.Tr>
            ) : logs.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center' }}>
                  <Text size="sm" c="dimmed">No logs yet</Text>
                </Table.Td>
              </Table.Tr>
            ) : logs.map((log) => (
              <Table.Tr key={log.id}>
                <Table.Td>
                  <Badge size="sm" variant="light" color={STATUS_COLOR[log.status]}>{log.status}</Badge>
                </Table.Td>
                <Table.Td><Text size="xs">{formatDateTime(log.startedAt)}</Text></Table.Td>
                <Table.Td><Text size="xs">{formatDuration(log.startedAt, log.endedAt) ?? '—'}</Text></Table.Td>
                <Table.Td>
                  <Badge size="xs" variant="outline" color={log.triggeredBy === 'MANUAL' ? 'violet' : 'gray'}>
                    {log.triggeredBy}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c={log.message ? 'red' : 'dimmed'} style={{ wordBreak: 'break-all' }}>
                    {log.message || '—'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {totalPages > 1 && (
          <Pagination size="sm" total={totalPages} value={page} onChange={setPage} />
        )}
      </Stack>
    </Modal>
  )
}
