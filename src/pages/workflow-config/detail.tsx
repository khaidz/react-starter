import { useState } from 'react'
import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { notifyError } from '@/lib/notify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconGitBranch,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconSchema,
  IconSettings,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import { adminFlowsApi } from '@/api/workflow.api'
import type { AssigneeTemplate, FlowStatus, FlowStep, Transition } from '@/types/workflow'
import { ActionModal } from './components/ActionModal'
import { AssigneeModal } from './components/AssigneeModal'
import { FlowDiagram } from './components/FlowDiagram'
import { StepModal } from './components/StepModal'
import { TransitionModal } from './components/TransitionModal'

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

const STEP_TYPE_LABEL: Record<string, string> = {
  START: 'Start',
  SEQUENTIAL: 'Sequential',
  PARALLEL: 'Parallel',
  SUB_FLOW: 'Sub-flow',
  FINISH: 'Finish',
}

const COMPLETION_LABEL: Record<string, string> = {
  ALL: 'All',
  ANY: 'Any',
  PERCENT: 'Percent',
}

const SLA_ACTION_LABEL: Record<string, string> = {
  AUTO_APPROVE: 'Auto approve',
  AUTO_REJECT: 'Auto reject',
  ESCALATE: 'Escalate',
}

const ASSIGNEE_TYPE_LABEL: Record<string, string> = {
  ROLE: 'Role',
  USER: 'User',
  DEPT_OWNER: 'Dept owner',
  WORKFLOW_CREATOR: 'Workflow creator',
  CONTEXT: 'Context',
}

// --- Sub-components ---

function StepCard({
  step,
  flowId,
  allSteps,
  isDraft,
}: {
  step: FlowStep
  flowId: number
  allSteps: FlowStep[]
  isDraft: boolean
}) {
  const queryClient = useQueryClient()
  const [stepModalOpen, { open: openStep, close: closeStep }] = useDisclosure(false)
  const [assigneeModalOpen, { open: openAssignee, close: closeAssignee }] = useDisclosure(false)
  const [editAssignee, setEditAssignee] = useState<AssigneeTemplate | undefined>()
  const [actionModalOpen, { open: openAction, close: closeAction }] = useDisclosure(false)
  const [transitionModalOpen, { open: openTransition, close: closeTransition }] = useDisclosure(false)
  const [editTransition, setEditTransition] = useState<Transition | undefined>()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-flows', flowId] })

  const deleteStepMutation = useMutation({
    mutationFn: () => adminFlowsApi.deleteStep(step.id),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Step deleted', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const deleteAssigneeMutation = useMutation({
    mutationFn: (id: number) => adminFlowsApi.deleteAssignee(id),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Assignee removed', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const deleteActionMutation = useMutation({
    mutationFn: (id: number) => adminFlowsApi.deleteAction(id),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Action removed', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const deleteTransitionMutation = useMutation({
    mutationFn: (id: number) => adminFlowsApi.deleteTransition(id),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Transition deleted', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  function handleEditTransition(t: Transition) {
    setEditTransition(t)
    openTransition()
  }

  function handleCloseTransitionModal() {
    setEditTransition(undefined)
    closeTransition()
  }

  const stepTypeColor: Record<string, string> = {
    START: 'teal',
    SEQUENTIAL: 'blue',
    PARALLEL: 'violet',
    SUB_FLOW: 'orange',
    FINISH: 'gray',
  }

  const isAutoStep = step.type === 'START' || step.type === 'FINISH'

  return (
    <>
      <Accordion.Item value={String(step.id)}>
        <Accordion.Control>
          <Group gap="xs">
            <Badge variant="outline" color={stepTypeColor[step.type] ?? 'gray'} size="sm">
              {step.stepOrder}. {STEP_TYPE_LABEL[step.type] ?? step.type}
            </Badge>
            <Text fw={600}>{step.name}</Text>
            <Badge variant="light" size="xs" color="gray">
              {COMPLETION_LABEL[step.completionCondition]}
              {step.completionCondition === 'PERCENT' && ` ${step.completionThreshold}%`}
            </Badge>
            {step.slaDuration && (
              <Badge variant="dot" size="xs" color="orange">
                SLA {step.slaDuration}s
              </Badge>
            )}
          </Group>
        </Accordion.Control>

        <Accordion.Panel>
          <Stack gap="md">
            {/* Step info */}
            <SimpleGrid cols={3} spacing="xs">
              <div>
                <Text size="xs" c="dimmed">Step type</Text>
                <Text size="sm">{STEP_TYPE_LABEL[step.type] ?? step.type}</Text>
              </div>
              {step.subFlowCode && (
                <div>
                  <Text size="xs" c="dimmed">Sub-flow</Text>
                  <Text size="sm" ff="monospace">{step.subFlowCode}</Text>
                </div>
              )}
              {step.slaDuration && (
                <div>
                  <Text size="xs" c="dimmed">SLA</Text>
                  <Text size="sm">
                    {step.slaDuration}s → {step.slaAction ? SLA_ACTION_LABEL[step.slaAction] : '—'}
                  </Text>
                </div>
              )}
              {step.maxRetries != null && (
                <div>
                  <Text size="xs" c="dimmed">Max retries</Text>
                  <Text size="sm">{step.maxRetries === 0 ? 'No retry' : step.maxRetries}</Text>
                </div>
              )}
              <div>
                <Text size="xs" c="dimmed">Allow pickup</Text>
                <Text size="sm">{step.allowPickup ? 'Yes' : 'No'}</Text>
              </div>
            </SimpleGrid>

            {isDraft && (
              <Group gap="xs">
                <Button size="xs" variant="light" leftSection={<IconPencil size={13} />} onClick={openStep}>
                  Edit step
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={13} />}
                  loading={deleteStepMutation.isPending}
                  onClick={() => deleteStepMutation.mutate()}
                >
                  Delete step
                </Button>
              </Group>
            )}

            {!isAutoStep && (
              <>
                <Divider />

                {/* Assignees */}
                <div>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={600}>Assignees</Text>
                    {isDraft && (
                      <Button size="xs" variant="subtle" leftSection={<IconPlus size={13} />} onClick={openAssignee}>
                        Add
                      </Button>
                    )}
                  </Group>
                  {step.assignees.length === 0 ? (
                    <Text size="sm" c="dimmed" fs="italic">No assignees</Text>
                  ) : (
                    <Table withRowBorders={false} verticalSpacing={4}>
                      <Table.Tbody>
                        {step.assignees.map((a) => (
                          <Table.Tr key={a.id}>
                            <Table.Td>
                              <Badge size="sm" variant="light" color="blue">
                                {ASSIGNEE_TYPE_LABEL[a.assigneeType] ?? a.assigneeType}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{a.assigneeValue || '—'}</Text>
                            </Table.Td>
                            {isDraft && (
                              <Table.Td style={{ width: 64 }}>
                                <Group gap={4}>
                                  <Tooltip label="Edit">
                                    <ActionIcon
                                      size="xs"
                                      variant="subtle"
                                      color="blue"
                                      onClick={() => { setEditAssignee(a); openAssignee() }}
                                    >
                                      <IconPencil size={13} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Remove">
                                    <ActionIcon
                                      size="xs"
                                      color="red"
                                      variant="subtle"
                                      loading={deleteAssigneeMutation.isPending}
                                      onClick={() => deleteAssigneeMutation.mutate(a.id)}
                                    >
                                      <IconTrash size={13} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Table.Td>
                            )}
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </div>

                <Divider />

                {/* Allowed Actions */}
                <div>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={600}>Actions</Text>
                    {isDraft && (
                      <Button size="xs" variant="subtle" leftSection={<IconPlus size={13} />} onClick={openAction}>
                        Add
                      </Button>
                    )}
                  </Group>
                  {step.allowedActions.length === 0 ? (
                    <Text size="sm" c="dimmed" fs="italic">No actions</Text>
                  ) : (
                    <Group gap="xs">
                      {step.allowedActions.map((a) => (
                        <Badge
                          key={a.actionType}
                          variant="filled"
                          size="sm"
                          color="cyan"
                          rightSection={
                            isDraft && a.id !== null ? (
                              <ActionIcon
                                size={12}
                                color="white"
                                variant="transparent"
                                loading={deleteActionMutation.isPending}
                                onClick={() => deleteActionMutation.mutate(a.id!)}
                              >
                                <IconX size={10} />
                              </ActionIcon>
                            ) : undefined
                          }
                        >
                          {a.name} ({a.actionType})
                        </Badge>
                      ))}
                    </Group>
                  )}
                </div>
              </>
            )}

            <Divider />

            {/* Transitions */}
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={600}>Transitions</Text>
                {isDraft && (
                  <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<IconPlus size={13} />}
                    onClick={openTransition}
                  >
                    Add
                  </Button>
                )}
              </Group>
              {step.transitions.length === 0 ? (
                <Text size="sm" c="dimmed" fs="italic">No transitions</Text>
              ) : (
                <Table withRowBorders withColumnBorders={false} verticalSpacing={6}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Action</Table.Th>
                      <Table.Th>From</Table.Th>
                      <Table.Th>To</Table.Th>
                      <Table.Th>Condition</Table.Th>
                      <Table.Th>Priority</Table.Th>
                      {isDraft && <Table.Th style={{ width: 64 }}></Table.Th>}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {step.transitions.map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td>
                          <Badge size="sm" variant="light" color="grape">
                            {t.actionType}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{t.fromStepName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{t.toStepName ?? '— END —'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" ff="monospace" c={t.conditionExpression ? 'dark' : 'dimmed'}>
                            {t.conditionExpression ?? (t.isDefault ? '[default]' : '—')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{t.priority}</Text>
                        </Table.Td>
                        {isDraft && (
                          <Table.Td>
                            <Group gap={4}>
                              <Tooltip label="Edit">
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="blue"
                                  onClick={() => handleEditTransition(t)}
                                >
                                  <IconPencil size={13} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Delete">
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="red"
                                  loading={deleteTransitionMutation.isPending}
                                  onClick={() => deleteTransitionMutation.mutate(t.id)}
                                >
                                  <IconTrash size={13} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </div>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* Modals */}
      <StepModal opened={stepModalOpen} onClose={closeStep} flowId={flowId} step={step} />
      <AssigneeModal
        opened={assigneeModalOpen}
        onClose={() => { setEditAssignee(undefined); closeAssignee() }}
        stepId={step.id}
        flowId={flowId}
        assignee={editAssignee}
      />
      <ActionModal opened={actionModalOpen} onClose={closeAction} stepId={step.id} flowId={flowId} />
      <TransitionModal
        opened={transitionModalOpen}
        onClose={handleCloseTransitionModal}
        flowId={flowId}
        steps={allSteps}
        transition={editTransition}
        defaultFromStepId={step.id}
      />
    </>
  )
}

// --- Detail panel (used as embedded component) ---

export function FlowDetailPanel({
  flowId: flowIdProp,
  onSelectFlow,
}: {
  flowId: number
  onSelectFlow: (id: number) => void
}) {
  const queryClient = useQueryClient()
  const id = flowIdProp

  const [addStepOpen, { open: openAddStep, close: closeAddStep }] = useDisclosure(false)
  const [activeTab, setActiveTab] = useState('config')

  const { data: flow, isLoading } = useQuery({
    queryKey: ['admin-flows', id],
    queryFn: () => adminFlowsApi.getDetail(id),
    enabled: !!id,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-flows', id] })

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ['admin-flows'] })

  const activateMutation = useMutation({
    mutationFn: () => adminFlowsApi.activate(id),
    onSuccess: () => {
      invalidate()
      invalidateList()
      notifications.show({ message: 'Flow activated', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => adminFlowsApi.deactivate(id),
    onSuccess: () => {
      invalidate()
      invalidateList()
      notifications.show({ message: 'Flow deactivated', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  const newVersionMutation = useMutation({
    mutationFn: () => adminFlowsApi.newVersion(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      notifications.show({ message: 'New version created', color: 'green' })
      if (data?.id) onSelectFlow(data.id)
    },
    onError: (error) => notifyError(error),
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminFlowsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      notifications.show({ message: 'Flow deleted', color: 'green' })
      onSelectFlow(0)
    },
    onError: (error) => notifyError(error),
  })

  if (isLoading) {
    return (
      <Stack align="center" justify="center" h={200}>
        <Loader />
      </Stack>
    )
  }

  if (!flow) {
    return (
      <Text c="red" ta="center" py="xl">
        Flow not found.
      </Text>
    )
  }

  const isDraft = flow.status === 'DRAFT'
  const sortedSteps = [...(flow.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder)

  return (
    <>
      <Stack gap="md">
        {/* Header */}
        <Group gap="xs">
          <div style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Title order={3}>{flow.name}</Title>
              <Badge color={STATUS_COLOR[flow.status]} variant="light">
                {STATUS_LABEL[flow.status]}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" ff="monospace">
              {flow.code} · v{flow.version} · Created {dayjs(flow.createdAt).format('DD/MM/YYYY')}
            </Text>
          </div>

          <Group gap="xs">
            {(flow.status === 'DRAFT' || flow.status === 'INACTIVE') && (
              <Button
                size="sm"
                color="green"
                leftSection={<IconPlayerPlay size={15} />}
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
                Activate
              </Button>
            )}
            {flow.status === 'ACTIVE' && (
              <Button
                size="sm"
                color="orange"
                leftSection={<IconPlayerPause size={15} />}
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
                Deactivate
              </Button>
            )}
            <Button
              size="sm"
              leftSection={<IconGitBranch size={15} />}
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
              New version
            </Button>
            <Button
              size="sm"
              color="red"
              leftSection={<IconTrash size={15} />}
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
              Delete
            </Button>
          </Group>
        </Group>

        {/* Tabs: Config / Diagram */}
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'config')} variant="outline">
          <Tabs.List mb="md">
            <Tabs.Tab value="config" leftSection={<IconSettings size={14} />}>
              Config
            </Tabs.Tab>
            <Tabs.Tab value="diagram" leftSection={<IconSchema size={14} />}>
              Diagram
            </Tabs.Tab>
          </Tabs.List>

          {/* Config tab */}
          <Tabs.Panel value="config">
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="md">
                <Text fw={600}>Steps ({sortedSteps.length})</Text>
                {isDraft && (
                  <Button size="sm" leftSection={<IconPlus size={15} />} onClick={openAddStep}>
                    Add step
                  </Button>
                )}
              </Group>

              {sortedSteps.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl" fs="italic">
                  No steps yet. Click &quot;Add step&quot; to get started.
                </Text>
              ) : (
                <Accordion
                  multiple
                  variant="separated"
                  radius="md"
                  styles={{ control: { backgroundColor: 'var(--mantine-color-gray-0)' } }}
                >
                  {sortedSteps.map((step) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      flowId={id}
                      allSteps={sortedSteps}
                      isDraft={isDraft}
                    />
                  ))}
                </Accordion>
              )}
            </Paper>
          </Tabs.Panel>

          {/* Diagram tab */}
          <Tabs.Panel value="diagram">
            <FlowDiagram steps={sortedSteps} isActive={activeTab === 'diagram'} />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <StepModal opened={addStepOpen} onClose={closeAddStep} flowId={id} />
    </>
  )
}
