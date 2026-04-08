import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Divider,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconChevronDown,
  IconChevronRight,
  IconDotsVertical,
  IconEdit,
  IconGitBranch,
  IconPlus,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { adminFlowsApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { ActionType, Flow, FlowStep, FlowSummary, Transition } from '@/types/workflow'
import { ActionModal, AssigneeModal } from './components/AssigneeModal'
import { CreateFlowModal } from './components/CreateFlowModal'
import { StepModal } from './components/StepModal'
import { TransitionModal } from './components/TransitionModal'
import styles from './workflow-config.module.scss'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:    { label: 'Draft',    color: 'gray'   },
  ACTIVE:   { label: 'Active',   color: 'green'  },
  INACTIVE: { label: 'Inactive', color: 'orange' },
}

const STEP_TYPE_COLOR: Record<string, string> = {
  START: 'teal', SEQUENTIAL: 'blue', PARALLEL: 'violet', FINISH: 'green',
}

function formatSla(seconds: number | null) {
  if (!seconds) return 'Không có SLA'
  if (seconds >= 86400) return `${seconds / 86400} ngày`
  if (seconds >= 3600)  return `${seconds / 3600} giờ`
  return `${seconds} giây`
}

/* ── Step Card ── */
interface StepCardProps {
  step: FlowStep
  allSteps: FlowStep[]
  flowId: number
  onEdit: (step: FlowStep) => void
}

function StepCard({ step, allSteps, flowId, onEdit }: StepCardProps) {
  const [expanded, { toggle }] = useDisclosure(true)
  const queryClient = useQueryClient()

  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [transitionOpen, setTransitionOpen] = useState(false)
  const [editingTransition, setEditingTransition] = useState<Transition | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-flow-detail', flowId] })

  const { mutate: deleteStep } = useMutation({
    mutationFn: () => adminFlowsApi.deleteStep(step.id),
    onSuccess: invalidate,
    onError: (error) => notifyError(error, 'Xóa Step thất bại'),
  })

  const { mutate: deleteAssignee } = useMutation({
    mutationFn: (id: number) => adminFlowsApi.deleteAssignee(id),
    onSuccess: invalidate,
    onError: (error) => notifyError(error, 'Xóa Assignee thất bại'),
  })

  const { mutate: deleteTransition } = useMutation({
    mutationFn: (id: number) => adminFlowsApi.deleteTransition(id),
    onSuccess: invalidate,
    onError: (error) => notifyError(error, 'Xóa Transition thất bại'),
  })

  // allowedActions là Map: { APPROVE: "Phê duyệt", REJECT: "Từ chối" }
  const allowedActionsEntries = Object.entries(step.allowedActions ?? {}) as [ActionType, string][]

  return (
    <>
      {assigneeOpen && (
        <AssigneeModal stepId={step.id} flowId={flowId} onClose={() => setAssigneeOpen(false)} />
      )}
      {actionOpen && (
        <ActionModal stepId={step.id} flowId={flowId} onClose={() => setActionOpen(false)} />
      )}
      {(transitionOpen || editingTransition) && (
        <TransitionModal
          flowId={flowId}
          steps={allSteps}
          transition={editingTransition}
          defaultFromStepId={step.id}
          onClose={() => { setTransitionOpen(false); setEditingTransition(null) }}
        />
      )}

      <div className={styles.stepCard}>
        {/* Header */}
        <div className={styles.stepCardHeader} onClick={toggle}>
          <div className={styles.stepOrder}>{step.stepOrder}</div>
          <div className={styles.stepName}>{step.name}</div>
          <Badge size="xs" variant="light" color={STEP_TYPE_COLOR[step.type] ?? 'gray'} radius="sm">
            {step.type}
          </Badge>
          {step.slaDuration && (
            <Text className={styles.stepMeta}>SLA: {formatSla(step.slaDuration)}</Text>
          )}
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            radius="md"
            onClick={(e) => { e.stopPropagation(); onEdit(step) }}
          >
            <IconEdit size={13} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            radius="md"
            onClick={(e) => { e.stopPropagation(); deleteStep() }}
          >
            <IconTrash size={13} />
          </ActionIcon>
          {expanded ? <IconChevronDown size={14} color="#9ca3af" /> : <IconChevronRight size={14} color="#9ca3af" />}
        </div>

        {/* Body */}
        <Collapse in={expanded}>
          <div className={styles.stepCardBody}>

            {/* Assignees */}
            <div className={styles.subSection}>
              <div className={styles.subSectionHeader}>
                <span className={styles.subSectionLabel}>Assignees</span>
                <Tooltip label="Thêm Assignee">
                  <ActionIcon size="xs" variant="subtle" color="blue" onClick={() => setAssigneeOpen(true)}>
                    <IconPlus size={11} />
                  </ActionIcon>
                </Tooltip>
              </div>
              <div className={styles.subSectionItems}>
                {(step.assignees ?? []).length === 0
                  ? <Text size="xs" c="dimmed">Chưa có assignee</Text>
                  : (step.assignees ?? []).map((a) => (
                      <span key={a.id} className={styles.chipItem}>
                        <Badge size="xs" variant="outline" color="blue" radius="sm" style={{ fontSize: 10 }}>
                          {a.assigneeType}
                        </Badge>
                        {a.assigneeValue}
                        <span className={styles.chipDelete} onClick={() => deleteAssignee(a.id)}>
                          <IconX size={10} />
                        </span>
                      </span>
                    ))
                }
              </div>
            </div>

            <Divider color="#f3f4f6" />

            {/* Allowed Actions (Map từ BE — không có ID để xóa riêng lẻ) */}
            <div className={styles.subSection}>
              <div className={styles.subSectionHeader}>
                <span className={styles.subSectionLabel}>Allowed Actions</span>
                <Tooltip label="Thêm Action Template">
                  <ActionIcon size="xs" variant="subtle" color="orange" onClick={() => setActionOpen(true)}>
                    <IconPlus size={11} />
                  </ActionIcon>
                </Tooltip>
              </div>
              <div className={styles.subSectionItems}>
                {allowedActionsEntries.length === 0
                  ? <Text size="xs" c="dimmed">Chưa có action</Text>
                  : allowedActionsEntries.map(([type, name]) => (
                      <span key={type} className={styles.chipItem}>
                        <Badge size="xs" variant="light" color="orange" radius="sm" style={{ fontSize: 10 }}>
                          {type}
                        </Badge>
                        {name}
                      </span>
                    ))
                }
              </div>
            </div>

            <Divider color="#f3f4f6" />

            {/* Transitions */}
            <div className={styles.subSection}>
              <div className={styles.subSectionHeader}>
                <span className={styles.subSectionLabel}>Transitions</span>
                <Tooltip label="Thêm Transition">
                  <ActionIcon size="xs" variant="subtle" color="violet" onClick={() => setTransitionOpen(true)}>
                    <IconPlus size={11} />
                  </ActionIcon>
                </Tooltip>
              </div>
              <Stack gap={4}>
                {(step.transitions ?? []).length === 0
                  ? <Text size="xs" c="dimmed">Chưa có transition</Text>
                  : (step.transitions ?? []).map((t) => (
                      <div key={t.id} className={styles.transitionRow}>
                        <Badge size="xs" variant="light" color="violet" radius="sm" style={{ fontSize: 10 }}>
                          {t.actionType}
                        </Badge>
                        <span className={styles.transitionArrow}>→</span>
                        <Text size="xs" style={{ flex: 1 }}>
                          {t.toStepName ?? 'Kết thúc'}
                          {t.isDefault && (
                            <Badge size="xs" ml={4} color="green" variant="dot">default</Badge>
                          )}
                          {t.conditionExpression && (
                            <Text size="xs" c="dimmed" span> [{t.conditionExpression}]</Text>
                          )}
                        </Text>
                        <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setEditingTransition(t)}>
                          <IconEdit size={11} />
                        </ActionIcon>
                        <ActionIcon size="xs" variant="subtle" color="red" onClick={() => deleteTransition(t.id)}>
                          <IconX size={11} />
                        </ActionIcon>
                      </div>
                    ))
                }
              </Stack>
            </div>
          </div>
        </Collapse>
      </div>
    </>
  )
}

/* ── Flow Detail Panel ── */
interface FlowDetailProps {
  flowId: number
  onSelectFlow: (id: number) => void
}

function FlowDetailPanel({ flowId, onSelectFlow }: FlowDetailProps) {
  const queryClient = useQueryClient()
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null)
  const [stepModalOpen, setStepModalOpen] = useState(false)

  const { data: flow, isLoading } = useQuery<Flow>({
    queryKey: ['admin-flow-detail', flowId],
    queryFn: () => adminFlowsApi.getDetail(flowId),
  })

  const { mutate: activate, isPending: activating } = useMutation({
    mutationFn: () => adminFlowsApi.activate(flowId),
    onSuccess: () => {
      // Activate có thể deactivate flow khác cùng code → invalidate tất cả detail cache
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      queryClient.invalidateQueries({ queryKey: ['admin-flow-detail'] })
    },
    onError: (error) => notifyError(error, 'Activate thất bại'),
  })

  const { mutate: deactivate, isPending: deactivating } = useMutation({
    mutationFn: () => adminFlowsApi.deactivate(flowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      queryClient.invalidateQueries({ queryKey: ['admin-flow-detail', flowId] })
    },
    onError: (error) => notifyError(error, 'Deactivate thất bại'),
  })

  const { mutate: newVersion, isPending: creatingVersion } = useMutation({
    mutationFn: () => adminFlowsApi.newVersion(flowId),
    onSuccess: (newFlow) => {
      // Refresh list rồi auto-select flow mới vừa tạo
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      onSelectFlow(newFlow.id)
    },
    onError: (error) => notifyError(error, 'Tạo version mới thất bại'),
  })

  if (isLoading) {
    return (
      <div className={styles.detailPanel}>
        <div className={styles.emptyState}><Loader size="sm" /></div>
      </div>
    )
  }

  if (!flow) return null

  const sortedSteps = [...(flow.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder)
  const nextOrder = sortedSteps.length

  return (
    <>
      {(stepModalOpen || editingStep) && (
        <StepModal
          flowId={flowId}
          step={editingStep}
          nextOrder={nextOrder}
          onClose={() => { setStepModalOpen(false); setEditingStep(null) }}
        />
      )}

      <div className={styles.detailPanel}>
        {/* Header */}
        <div className={styles.detailHeader}>
          <div>
            <Text className={styles.detailTitle}>{flow.name}</Text>
            <Text className={styles.detailCode}>{flow.code} · v{flow.version}</Text>
          </div>
          <Group gap="xs">
            <Badge color={STATUS_CONFIG[flow.status]?.color ?? 'gray'} variant="light" radius="sm">
              {STATUS_CONFIG[flow.status]?.label ?? flow.status}
            </Badge>

            {(flow.status === 'DRAFT' || flow.status === 'INACTIVE') && (
              <Button
                size="xs"
                radius="md"
                color="green"
                leftSection={<IconPlayerPlay size={13} />}
                loading={activating}
                onClick={() => activate()}
              >
                Activate
              </Button>
            )}

            {flow.status === 'ACTIVE' && (
              <Button
                size="xs"
                radius="md"
                color="orange"
                leftSection={<IconPlayerStop size={13} />}
                loading={deactivating}
                onClick={() => deactivate()}
              >
                Deactivate
              </Button>
            )}

            {/* New Version chỉ khả dụng từ ACTIVE hoặc INACTIVE */}
            <Tooltip label={flow.status === 'DRAFT' ? 'Cần Activate trước khi tạo version mới' : 'Tạo DRAFT version mới từ flow này'}>
              <Button
                size="xs"
                radius="md"
                variant="subtle"
                color="blue"
                leftSection={<IconGitBranch size={13} />}
                loading={creatingVersion}
                disabled={flow.status === 'DRAFT'}
                onClick={() => newVersion()}
              >
                New Version
              </Button>
            </Tooltip>
          </Group>
        </div>

        {/* Steps */}
        <div className={styles.detailBody}>
          <div className={styles.stepsHeader}>
            <Text className={styles.stepsLabel}>Steps ({sortedSteps.length})</Text>
            <Button
              size="xs"
              radius="md"
              color="vibOrange"
              leftSection={<IconPlus size={13} />}
              onClick={() => { setEditingStep(null); setStepModalOpen(true) }}
            >
              Thêm Step
            </Button>
          </div>

          {sortedSteps.length === 0 ? (
            <div className={styles.emptyState}>
              <IconGitBranch size={32} color="#d1d5db" />
              <Text className={styles.emptyStateText}>
                Chưa có step nào. Thêm bước START trước để bắt đầu.
              </Text>
            </div>
          ) : (
            sortedSteps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                allSteps={sortedSteps}
                flowId={flowId}
                onEdit={(s) => { setEditingStep(s); setStepModalOpen(false) }}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}

/* ── Main Page ── */
export function WorkflowConfigPage() {
  const queryClient = useQueryClient()
  const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false)
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null)

  const { data: flows = [], isLoading } = useQuery<FlowSummary[]>({
    queryKey: ['admin-flows'],
    queryFn: adminFlowsApi.list,
  })

  const { mutate: deleteFlow } = useMutation({
    mutationFn: (id: number) => adminFlowsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      if (selectedFlowId === id) setSelectedFlowId(null)
    },
    onError: (error) => notifyError(error, 'Xóa Flow thất bại'),
  })

  return (
    <>
      <CreateFlowModal opened={createOpen} onClose={closeCreate} />

      <div className={styles.page}>
        {/* ── Left: Flow List ── */}
        <div className={styles.flowPanel}>
          <div className={styles.flowPanelHeader}>
            <Text className={styles.flowPanelTitle}>Workflows</Text>
            <Button
              size="xs"
              radius="md"
              color="vibOrange"
              leftSection={<IconPlus size={13} />}
              fullWidth
              onClick={openCreate}
            >
              Tạo Flow mới
            </Button>
          </div>

          <div className={styles.flowList}>
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                <Loader size="sm" />
              </div>
            )}
            {flows.map((flow) => (
              <div key={flow.id} style={{ position: 'relative' }}>
                <button
                  className={`${styles.flowItem} ${selectedFlowId === flow.id ? styles.flowItemActive : ''}`}
                  onClick={() => setSelectedFlowId(flow.id)}
                >
                  <div className={styles.flowItemName}>{flow.name}</div>
                  <div className={styles.flowItemMeta}>
                    <Badge
                      size="xs"
                      color={STATUS_CONFIG[flow.status]?.color ?? 'gray'}
                      variant="dot"
                    >
                      {STATUS_CONFIG[flow.status]?.label ?? flow.status}
                    </Badge>
                    · v{flow.version}
                  </div>
                </button>

                <Menu shadow="md" width={160} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconDotsVertical size={12} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconTrash size={13} />}
                      color="red"
                      onClick={() => deleteFlow(flow.id)}
                    >
                      Xóa (chỉ DRAFT)
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Detail Panel ── */}
        {selectedFlowId ? (
          <FlowDetailPanel key={selectedFlowId} flowId={selectedFlowId} onSelectFlow={setSelectedFlowId} />
        ) : (
          <div className={`${styles.detailPanel} ${styles.emptyState}`}>
            <IconGitBranch size={40} color="#d1d5db" />
            <Text className={styles.emptyStateText}>Chọn một Workflow để xem chi tiết</Text>
          </div>
        )}
      </div>
    </>
  )
}
