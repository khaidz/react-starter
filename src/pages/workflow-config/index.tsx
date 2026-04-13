import type React from 'react'
import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import { notifyError } from '@/lib/notify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconGitBranch,
  IconGitFork,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import { adminFlowsApi } from '@/api/workflow.api'
import type { FlowStatus, FlowSummary } from '@/types/workflow'
import { CreateFlowModal } from './components/CreateFlowModal'
import { FlowDetailPanel } from './detail'
import styles from './workflow-config.module.scss'

const STATUS_COLOR: Record<FlowStatus, string> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  INACTIVE: 'red',
}

const STATUS_LABEL: Record<FlowStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

// ── Flow list item ──────────────────────────────────────────────

function FlowListItem({
  flow,
  selected,
  onSelect,
  onDeleted,
  onNewVersion,
}: {
  flow: FlowSummary
  selected: boolean
  onSelect: (id: number) => void
  onDeleted: (id: number) => void
  onNewVersion: (newId: number) => void
}) {
  const queryClient = useQueryClient()
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ['admin-flows'] })

  const deleteMutation = useMutation({
    mutationFn: () => adminFlowsApi.delete(flow.id),
    onSuccess: () => {
      invalidateList()
      onDeleted(flow.id)
      notifications.show({ message: 'Flow deleted', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const activateMutation = useMutation({
    mutationFn: () => adminFlowsApi.activate(flow.id),
    onSuccess: () => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: ['admin-flows', flow.id] })
      notifications.show({ message: 'Flow activated', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => adminFlowsApi.deactivate(flow.id),
    onSuccess: () => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: ['admin-flows', flow.id] })
      notifications.show({ message: 'Flow deactivated', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const newVersionMutation = useMutation({
    mutationFn: () => adminFlowsApi.newVersion(flow.id),
    onSuccess: (data) => {
      invalidateList()
      notifications.show({ message: 'New version created', color: 'green' })
      if (data?.id) onNewVersion(data.id)
    },
    onError: (error) => notifyError(error),
  })

  return (
    <div
      className={`${styles.flowItem} ${selected ? styles.active : ''}`}
      onClick={() => onSelect(flow.id)}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} ff="monospace" truncate>
            {flow.code}
          </Text>
          <Text size="sm" c="dimmed" truncate>
            {flow.name}
          </Text>
          <Group gap={4} mt={3}>
            <Badge size="sm" color={STATUS_COLOR[flow.status]} variant="light">
              {STATUS_LABEL[flow.status]}
            </Badge>
            <Text size="sm" c="dimmed">
              v{flow.version}
            </Text>
          </Group>
        </div>

        <Group gap={2} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
          <Tooltip label="New version" withArrow>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="blue"
              loading={newVersionMutation.isPending}
              onClick={() =>
                modals.openConfirmModal({
                  title: 'New version',
                  children: `Create a new draft version of "${flow.name}"?`,
                  labels: { confirm: 'Create', cancel: 'Cancel' },
                  onConfirm: () => newVersionMutation.mutate(),
                })
              }
            >
              <IconGitBranch size={13} />
            </ActionIcon>
          </Tooltip>

          {(flow.status === 'DRAFT' || flow.status === 'INACTIVE') && (
            <Tooltip label="Activate" withArrow>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="green"
                loading={activateMutation.isPending}
                onClick={() =>
                  modals.openConfirmModal({
                    title: 'Activate flow',
                    children: `Activate "${flow.name}"? It will be available for new workflow instances.`,
                    labels: { confirm: 'Activate', cancel: 'Cancel' },
                    confirmProps: { color: 'green' },
                    onConfirm: () => activateMutation.mutate(),
                  })
                }
              >
                <IconPlayerPlay size={13} />
              </ActionIcon>
            </Tooltip>
          )}

          {flow.status === 'ACTIVE' && (
            <Tooltip label="Deactivate" withArrow>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="orange"
                loading={deactivateMutation.isPending}
                onClick={() =>
                  modals.openConfirmModal({
                    title: 'Deactivate flow',
                    children: `Deactivate "${flow.name}"? No new instances can be started.`,
                    labels: { confirm: 'Deactivate', cancel: 'Cancel' },
                    confirmProps: { color: 'orange' },
                    onConfirm: () => deactivateMutation.mutate(),
                  })
                }
              >
                <IconPlayerPause size={13} />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip label="Delete" withArrow>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              loading={deleteMutation.isPending}
              onClick={() =>
                modals.openConfirmModal({
                  title: 'Delete flow',
                  children: `Delete "${flow.name}"? This action cannot be undone.`,
                  labels: { confirm: 'Delete', cancel: 'Cancel' },
                  confirmProps: { color: 'red' },
                  onConfirm: () => deleteMutation.mutate(),
                })
              }
            >
              <IconTrash size={13} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────

export function WorkflowConfigPage() {
  const queryClient = useQueryClient()
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null)
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)
  const [statusFilter, setStatusFilter] = useState<FlowStatus[]>(['DRAFT', 'ACTIVE', 'INACTIVE'])
  const [importing, setImporting] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-flows'],
    queryFn: adminFlowsApi.list,
  })

  const allFlows: FlowSummary[] = Array.isArray(data)
    ? (data as FlowSummary[])
    : ((data as unknown as { content?: FlowSummary[] })?.content ?? [])

  const flows = allFlows.filter((f) => statusFilter.includes(f.status))

  function handleFlowCreated(id: number) {
    queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
    setSelectedFlowId(id)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const flow = await adminFlowsApi.importFlow(file)
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      setSelectedFlowId(flow.id)
      notifications.show({ message: `Imported "${flow.name}" successfully`, color: 'green' })
    } catch (err) {
      notifyError(err)
    } finally {
      setImporting(false)
    }
  }

  function handleDeleted(id: number) {
    if (selectedFlowId === id) setSelectedFlowId(null)
  }

  function handleNewVersion(newId: number) {
    setSelectedFlowId(newId)
  }

  return (
    <div className={styles.page}>
      <Group justify="space-between" align="center" className={styles.pageHeader}>
        <Title order={3}>Workflow Configuration</Title>
      </Group>

      <div className={styles.layout}>
        {/* ── Left: flow list ── */}
        <div className={styles.leftPanel}>
          <div className={styles.leftHeader}>
            <Group gap={6} align="center">
              <Button
                style={{ flex: 1 }}
                leftSection={<IconPlus size={13} />}
                variant="light"
                onClick={openCreate}
              >
                New Flow
              </Button>
              <Tooltip label="Import from JSON" withArrow>
                <Button
                  style={{ flex: 1 }}
                  variant="light"
                  color="cyan"
                  leftSection={<IconUpload size={13} />}
                  loading={importing}
                  onClick={() => document.getElementById('import-flow-input')?.click()}
                >
                  Import
                </Button>
              </Tooltip>
              <Tooltip label="Refresh" withArrow>
                <ActionIcon variant="subtle" color="gray" loading={isLoading} onClick={() => refetch()}>
                  <IconRefresh size={15} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <input
              id="import-flow-input"
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <Checkbox.Group
              mt="xs"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as FlowStatus[])}
            >
              <Group gap="xs">
                <Checkbox size="xs" value="DRAFT" label="Draft" color="gray" />
                <Checkbox size="xs" value="ACTIVE" label="Active" color="green" />
                <Checkbox size="xs" value="INACTIVE" label="Inactive" color="red" />
              </Group>
            </Checkbox.Group>
          </div>

          <div className={styles.flowList}>
            {isLoading && (
              <Text size="xs" c="dimmed" ta="center" py="md">
                Loading...
              </Text>
            )}
            {!isLoading && flows.length === 0 && (
              <Text size="xs" c="dimmed" ta="center" py="md">
                No flows yet.
              </Text>
            )}
            {flows.map((flow) => (
              <FlowListItem
                key={flow.id}
                flow={flow}
                selected={selectedFlowId === flow.id}
                onSelect={setSelectedFlowId}
                onDeleted={handleDeleted}
                onNewVersion={handleNewVersion}
              />
            ))}
          </div>
        </div>

        {/* ── Right: detail ── */}
        <div className={styles.rightPanel}>
          {selectedFlowId ? (
            <FlowDetailPanel flowId={selectedFlowId} onSelectFlow={setSelectedFlowId} />
          ) : (
            <div className={styles.emptyState}>
              <IconGitFork size={36} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" size="sm">
                Select a flow to view details
              </Text>
            </div>
          )}
        </div>
      </div>

      <CreateFlowModal opened={createOpened} onClose={closeCreate} onCreated={handleFlowCreated} />
    </div>
  )
}
