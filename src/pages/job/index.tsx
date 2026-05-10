import { jobsApi } from '@/api/jobs.api'
import type { JobItem } from '@/types/api'
import { ActionIcon, Group, Stack, Text, Title, Tooltip } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { JobCard } from './components/JobCard'

export function JobPage() {
  const { data: jobs = [], isLoading, isFetching, refetch } = useQuery<JobItem[]>({
    queryKey: ['jobs'],
    queryFn: jobsApi.list,
    refetchInterval: 30_000,
  })

  return (
    <>
      <title>Job Management</title>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={3}>Job Management</Title>
          <Tooltip label="Refresh" withArrow>
            <ActionIcon variant="subtle" color="gray" onClick={() => refetch()} loading={isFetching && !isLoading}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        {isLoading ? (
          <Text size="sm" c="dimmed">Loading...</Text>
        ) : jobs.length === 0 ? (
          <Text size="sm" c="dimmed">No jobs found</Text>
        ) : (
          <Stack gap="xs">
            {jobs.map((job) => <JobCard key={job.name} job={job} />)}
          </Stack>
        )}
      </Stack>
    </>
  )
}
