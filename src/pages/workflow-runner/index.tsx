import { useState } from 'react'
import {
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconArrowRight,
  IconListCheck,
  IconPlayerPlay,
  IconRefresh,
  IconTimeline,
  IconUserShare,
} from '@tabler/icons-react'
import { workflowApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { MyTask, WorkflowInstance, WorkflowStatus } from '@/types/workflow'
import { DelegationPanel } from './components/DelegationPanel'
import { StartWorkflowModal } from './components/StartWorkflowModal'
import { InstanceDetailPanel } from './detail'
import styles from './workflow-runner.module.scss'

const WORKFLOW_STATUS_COLOR: Record<WorkflowStatus, string> = {
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
  ERROR: 'orange',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ERROR', label: 'Error' },
]

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US')
}

// ── Instance list item ──────────────────────────────────────────

function InstanceItem({
  instance,
  selected,
  onSelect,
}: {
  instance: WorkflowInstance
  selected: boolean
  onSelect: (id: number) => void
}) {
  return (
    <div
      className={`${styles.instanceItem} ${selected ? styles.active : ''}`}
      onClick={() => onSelect(instance.id)}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} size="sm" truncate>
            {instance.businessKey}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace" truncate>
            {instance.flowCode} v{instance.flowVersion}
          </Text>
          <Group gap={4} mt={3}>
            <Badge size="xs" color={WORKFLOW_STATUS_COLOR[instance.status]} variant="light">
              {instance.status}
            </Badge>
            <Text size="xs" c="dimmed">
              #{instance.id}
            </Text>
          </Group>
        </div>
      </Group>
    </div>
  )
}

// ── My task item ────────────────────────────────────────────────

function MyTaskItem({
  task,
  selected,
  onSelect,
}: {
  task: MyTask
  selected: boolean
  onSelect: (id: number) => void
}) {
  return (
    <div
      className={`${styles.instanceItem} ${selected ? styles.active : ''}`}
      onClick={() => onSelect(task.workflowInstanceId)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text fw={700} size="sm" truncate>
          {task.businessKey}
        </Text>
        <Text size="xs" c="dimmed" truncate>
          {task.stepName}
        </Text>
        <Text size="xs" ff="monospace" c="dimmed" truncate>
          {task.flowCode}
        </Text>
        {task.dueTime && (
          <Text size="xs" c="orange">
            Due: {formatDateTime(task.dueTime)}
          </Text>
        )}
      </div>
    </div>
  )
}

// ── Pickup task item ────────────────────────────────────────────

function PickupTaskItem({
  task,
  selected,
  onSelect,
  onPickedUp,
}: {
  task: MyTask
  selected: boolean
  onSelect: (id: number) => void
  onPickedUp: () => void
}) {
  const pickupMutation = useMutation({
    mutationFn: () => workflowApi.pickup(task.workflowInstanceId, task.stepInstanceId),
    onSuccess: () => {
      notifications.show({ message: `Task picked up: ${task.stepName}`, color: 'green' })
      onPickedUp()
    },
    onError: (error) => notifyError(error),
  })

  return (
    <div
      className={`${styles.instanceItem} ${selected ? styles.active : ''}`}
      onClick={() => onSelect(task.workflowInstanceId)}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} size="sm" truncate>
            {task.businessKey}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {task.stepName}
          </Text>
          <Text size="xs" ff="monospace" c="dimmed" truncate>
            {task.flowCode}
          </Text>
          {task.dueTime && (
            <Text size="xs" c="orange">
              Due: {formatDateTime(task.dueTime)}
            </Text>
          )}
        </div>
        <Button
          size="xs"
          variant="light"
          color="teal"
          leftSection={<IconArrowRight size={11} />}
          loading={pickupMutation.isPending}
          onClick={(e) => {
            e.stopPropagation()
            pickupMutation.mutate()
          }}
        >
          Pick up
        </Button>
      </Group>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────

export function WorkflowRunnerPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string>('instances')
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null)
  const [startOpened, { open: openStart, close: closeStart }] = useDisclosure(false)

  // Filters for instance list
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [flowCodeFilter, setFlowCodeFilter] = useState('')
  const [businessKeyFilter, setBusinessKeyFilter] = useState('')

  const [debouncedFlowCode] = useDebouncedValue(flowCodeFilter, 400)
  const [debouncedBusinessKey] = useDebouncedValue(businessKeyFilter, 400)

  const searchParams = {
    status: statusFilter ? (statusFilter as WorkflowStatus) : undefined,
    flowCode: debouncedFlowCode.trim() || undefined,
    businessKey: debouncedBusinessKey.trim() || undefined,
  }

  const { data: instances = [], isLoading: loadingInstances, refetch: refetchInstances } = useQuery({
    queryKey: ['workflow-instances', searchParams],
    queryFn: () => workflowApi.search(searchParams),
  })

  const { data: myTasksData, isLoading: loadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['workflow-my-tasks'],
    queryFn: () => workflowApi.getMyTasks(),
  })

  const { data: pickupTasks = [], isLoading: loadingPickup, refetch: refetchPickup } = useQuery({
    queryKey: ['workflow-pickup-tasks'],
    queryFn: () => workflowApi.getPickupTasks(),
  })

  const myTasks: MyTask[] = myTasksData?.content ?? []

  function handleStarted(instance: WorkflowInstance) {
    queryClient.invalidateQueries({ queryKey: ['workflow-instances'] })
    setSelectedInstanceId(instance.id)
    setActiveTab('instances')
  }

  function handlePickedUp() {
    refetchPickup()
    refetchTasks()
    refetchInstances()
  }

  // Clear selected instance when switching to delegation tab
  function handleTabChange(tab: string | null) {
    setActiveTab(tab ?? 'instances')
    if (tab === 'delegation') setSelectedInstanceId(null)
  }

  const showDelegationPanel = activeTab === 'delegation'

  return (
    <div className={styles.page}>
      <Group justify="space-between" align="center" className={styles.pageHeader}>
        <Title order={3}>Workflow Runner</Title>
        <Button leftSection={<IconPlayerPlay size={14} />} onClick={openStart}>
          New Instance
        </Button>
      </Group>

      <div className={styles.layout}>
        {/* ── Left panel ── */}
        <div className={styles.leftPanel}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
          >
            <Tabs.List style={{ flexShrink: 0 }}>
              <Tabs.Tab value="instances" leftSection={<IconTimeline size={13} />}>
                Instances
              </Tabs.Tab>
              <Tabs.Tab value="tasks" leftSection={<IconListCheck size={13} />}>
                Tasks
                {myTasks.length > 0 && (
                  <Badge size="xs" color="red" variant="filled" ml={4}>
                    {myTasks.length}
                  </Badge>
                )}
              </Tabs.Tab>
              <Tabs.Tab value="pickup" leftSection={<IconArrowRight size={13} />}>
                Pickup
                {pickupTasks.length > 0 && (
                  <Badge size="xs" color="teal" variant="filled" ml={4}>
                    {pickupTasks.length}
                  </Badge>
                )}
              </Tabs.Tab>
              <Tabs.Tab value="delegation" leftSection={<IconUserShare size={13} />}>
                Delegation
              </Tabs.Tab>
            </Tabs.List>

            {/* Instances tab */}
            <Tabs.Panel
              value="instances"
              style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
            >
              <div className={styles.leftHeader}>
                <Stack gap={4}>
                  <Select
                    size="xs"
                    placeholder="Status"
                    data={STATUS_OPTIONS}
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v ?? '')}
                    clearable
                  />
                  <TextInput
                    size="xs"
                    placeholder="Flow code"
                    value={flowCodeFilter}
                    onChange={(e) => setFlowCodeFilter(e.target.value)}
                  />
                  <TextInput
                    size="xs"
                    placeholder="Business key"
                    value={businessKeyFilter}
                    onChange={(e) => setBusinessKeyFilter(e.target.value)}
                  />
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconRefresh size={12} />}
                    onClick={() => refetchInstances()}
                    loading={loadingInstances}
                  >
                    Refresh
                  </Button>
                </Stack>
              </div>
              <div className={styles.instanceList}>
                {!loadingInstances && instances.length === 0 && (
                  <Text size="xs" c="dimmed" ta="center" py="md">
                    No instances found.
                  </Text>
                )}
                {instances.map((inst) => (
                  <InstanceItem
                    key={inst.id}
                    instance={inst}
                    selected={selectedInstanceId === inst.id}
                    onSelect={setSelectedInstanceId}
                  />
                ))}
              </div>
            </Tabs.Panel>

            {/* My Tasks tab */}
            <Tabs.Panel
              value="tasks"
              style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
            >
              <div className={styles.leftHeader}>
                <Button
                  size="xs"
                  variant="light"
                  fullWidth
                  leftSection={<IconRefresh size={12} />}
                  onClick={() => refetchTasks()}
                  loading={loadingTasks}
                >
                  Refresh
                </Button>
              </div>
              <div className={styles.instanceList}>
                {!loadingTasks && myTasks.length === 0 && (
                  <Text size="xs" c="dimmed" ta="center" py="md">
                    No tasks.
                  </Text>
                )}
                {myTasks.map((task) => (
                  <MyTaskItem
                    key={`${task.workflowInstanceId}-${task.stepInstanceId}`}
                    task={task}
                    selected={selectedInstanceId === task.workflowInstanceId}
                    onSelect={setSelectedInstanceId}
                  />
                ))}
              </div>
            </Tabs.Panel>

            {/* Pickup tab */}
            <Tabs.Panel
              value="pickup"
              style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
            >
              <div className={styles.leftHeader}>
                <Button
                  size="xs"
                  variant="light"
                  fullWidth
                  leftSection={<IconRefresh size={12} />}
                  onClick={() => refetchPickup()}
                  loading={loadingPickup}
                >
                  Refresh
                </Button>
              </div>
              <div className={styles.instanceList}>
                {!loadingPickup && pickupTasks.length === 0 && (
                  <Text size="xs" c="dimmed" ta="center" py="md">
                    No pickup tasks available.
                  </Text>
                )}
                {pickupTasks.map((task) => (
                  <PickupTaskItem
                    key={`${task.workflowInstanceId}-${task.stepInstanceId}`}
                    task={task}
                    selected={selectedInstanceId === task.workflowInstanceId}
                    onSelect={setSelectedInstanceId}
                    onPickedUp={handlePickedUp}
                  />
                ))}
              </div>
            </Tabs.Panel>

            {/* Delegation tab — content displayed in right panel */}
            <Tabs.Panel value="delegation" style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" ta="center" py="md" px="sm">
                View and manage delegations in the right panel.
              </Text>
            </Tabs.Panel>
          </Tabs>
        </div>

        {/* ── Right panel ── */}
        <div className={styles.rightPanel}>
          {showDelegationPanel ? (
            <DelegationPanel />
          ) : selectedInstanceId ? (
            <InstanceDetailPanel
              instanceId={selectedInstanceId}
              onCancelled={() => refetchInstances()}
              onDataChanged={() => {
                refetchInstances()
                refetchTasks()
              }}
            />
          ) : (
            <div className={styles.emptyState}>
              <IconTimeline size={36} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" size="sm">
                Select a workflow instance to view its timeline
              </Text>
            </div>
          )}
        </div>
      </div>

      <StartWorkflowModal opened={startOpened} onClose={closeStart} onStarted={handleStarted} />
    </div>
  )
}
