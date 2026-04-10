import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconRefresh, IconShare, IconX } from '@tabler/icons-react'
import { workflowApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { ActionType, StepInstance, StepTimeline, WorkflowStatus } from '@/types/workflow'
import { ActionModal } from './components/ActionModal'
import { ShareModal } from './components/ShareModal'
import styles from './workflow-runner.module.scss'

const WORKFLOW_STATUS_COLOR: Record<WorkflowStatus, string> = {
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
  ERROR: 'orange',
}

const STEP_STATUS_COLOR: Record<string, string> = {
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  SKIPPED: 'dimmed',
  ERROR: 'red',
}

const ACTION_COLOR: Partial<Record<ActionType, string>> = {
  APPROVE: 'green',
  REJECT: 'red',
  REWORK: 'orange',
  CANCEL: 'red',
  FINISH: 'teal',
  TRANSFER: 'violet',
  EDIT: 'blue',
  SHARE: 'cyan',
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US')
}

function StepCard({
  step,
  stepInstance,
  workflowInstanceId,
  currentUsername,
  onActionSuccess,
}: {
  step: StepTimeline
  /** Step instance tương ứng từ getInstance — chứa id + allowedActions */
  stepInstance: StepInstance | undefined
  workflowInstanceId: number
  currentUsername: string | undefined
  onActionSuccess: () => void
}) {
  const [pendingAction, setPendingAction] = useState<{
    type: ActionType
    label: string
    stepInstanceId: number
  } | null>(null)

  const isActive = step.status === 'IN_PROGRESS'
  const isAssignee = !!currentUsername && step.assignees?.some((a) => a.userId === currentUsername)
  const allowedActions = stepInstance?.allowedActions ?? []
  const hasActions = isActive && isAssignee && allowedActions.length > 0
  const canPickup = isActive && !!stepInstance?.allowPickup

  const pickupMutation = useMutation({
    mutationFn: () => workflowApi.pickup(workflowInstanceId, stepInstance!.id),
    onSuccess: () => {
      notifications.show({ message: 'Task picked up', color: 'teal' })
      onActionSuccess()
    },
    onError: (error) => notifyError(error),
  })

  return (
    <div className={`${styles.stepCard} ${isActive ? styles.activeStep : ''}`}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} align="center">
            <Text fw={600} size="sm">
              {step.stepOrder}. {step.stepName}
            </Text>
            <Badge size="xs" variant="light" color="gray">
              {step.stepType}
            </Badge>
            {step.status && (
              <Badge size="xs" color={STEP_STATUS_COLOR[step.status] ?? 'gray'} variant="light">
                {step.status}
              </Badge>
            )}
          </Group>

          {step.startTime && (
            <Text size="xs" c="dimmed">
              Started: {formatDateTime(step.startTime)}
              {step.endTime && ` — Ended: ${formatDateTime(step.endTime)}`}
              {step.dueTime && ` | Due: ${formatDateTime(step.dueTime)}`}
            </Text>
          )}

          {step.assignees?.length > 0 && (
            <Text size="xs" c="dimmed" mt={2}>
              Assignees: {step.assignees.map((a) => a.displayName ?? a.userId).join(', ')}
            </Text>
          )}

          {step.actionLogs?.length > 0 && (
            <Stack gap={2} mt={4}>
              {step.actionLogs.map((log, i) => (
                <div key={i} className={styles.actionLog}>
                  [{log.actionType}] {log.performedBy} — {log.comment ?? '(no comment)'}{' '}
                  <span style={{ color: 'var(--mantine-color-dimmed)' }}>
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </Stack>
          )}

          {step.subFlowCode && (
            <Text size="xs" c="dimmed" mt={2}>
              Sub-flow: <strong>{step.subFlowCode}</strong>
              {step.subWorkflowInstanceId && ` (ID: ${step.subWorkflowInstanceId})`}
            </Text>
          )}
        </div>
      </Group>

      {(hasActions || canPickup) && stepInstance && (
        <Group gap="xs" mt="xs">
          {hasActions && allowedActions.map((a) => (
            <Button
              key={a.actionType}
              size="xs"
              color={ACTION_COLOR[a.actionType] ?? 'blue'}
              variant="light"
              onClick={() =>
                setPendingAction({
                  type: a.actionType,
                  label: a.name,
                  stepInstanceId: stepInstance.id,
                })
              }
            >
              {a.name}
            </Button>
          ))}
          {canPickup && (
            <Button
              size="xs"
              color="cyan"
              variant="light"
              loading={pickupMutation.isPending}
              onClick={() => pickupMutation.mutate()}
            >
              Pick up
            </Button>
          )}
        </Group>
      )}

      {pendingAction && stepInstance && (
        <ActionModal
          opened={!!pendingAction}
          workflowInstanceId={workflowInstanceId}
          stepInstanceId={pendingAction.stepInstanceId}
          actionType={pendingAction.type}
          actionLabel={pendingAction.label}
          onClose={() => setPendingAction(null)}
          onSuccess={() => {
            setPendingAction(null)
            onActionSuccess()
          }}
        />
      )}
    </div>
  )
}

export function InstanceDetailPanel({
  instanceId,
  onCancelled,
  onDataChanged,
}: {
  instanceId: number
  onCancelled: () => void
  /** Gọi khi có bất kỳ thay đổi state để left panel cập nhật danh sách */
  onDataChanged?: () => void
}) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [shareOpened, { open: openShare, close: closeShare }] = useDisclosure(false)

  const { data: timeline, isLoading: loadingTimeline, refetch: refetchTimeline } = useQuery({
    queryKey: ['workflow-timeline', instanceId],
    queryFn: () => workflowApi.getTimeline(instanceId),
  })

  // getInstance cung cấp stepInstance.id + allowedActions (không có trong timeline)
  const { data: instance, refetch: refetchInstance } = useQuery({
    queryKey: ['workflow-instance', instanceId],
    queryFn: () => workflowApi.getInstance(instanceId),
  })

  function refetchAll() {
    refetchTimeline()
    refetchInstance()
    onDataChanged?.()
  }

  const cancelMutation = useMutation({
    mutationFn: () => workflowApi.cancel(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-timeline', instanceId] })
      queryClient.invalidateQueries({ queryKey: ['workflow-instance', instanceId] })
      notifications.show({ message: 'Workflow cancelled', color: 'orange' })
      onCancelled()
      onDataChanged?.()
    },
    onError: (error) => notifyError(error),
  })

  if (loadingTimeline) {
    return (
      <div className={styles.detailCard} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="sm" />
      </div>
    )
  }

  if (!timeline) return null

  // Map stepOrder → StepInstance để tra nhanh
  const stepInstanceByOrder = new Map<number, StepInstance>(
    (instance?.steps ?? []).map((s) => [s.stepOrder, s]),
  )

  const canCancel = timeline.status === 'PENDING' || timeline.status === 'IN_PROGRESS'

  return (
    <div className={styles.detailCard}>
      {/* Header */}
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Group gap={8} align="center">
            <Text fw={700} size="md" ff="monospace">
              {timeline.flowCode}
            </Text>
            <Badge size="sm" color={WORKFLOW_STATUS_COLOR[timeline.status]} variant="filled">
              {timeline.status}
            </Badge>
          </Group>
          <Text size="sm">{timeline.flowName}</Text>
          <Text size="xs" c="dimmed">
            Business Key: <strong>{timeline.businessKey}</strong> | v{timeline.flowVersion} | Created
            by {timeline.createdBy} at {formatDateTime(timeline.createdAt)}
          </Text>
        </div>
        <Group gap={4}>
          <Tooltip label="Refresh" withArrow>
            <ActionIcon size="sm" variant="subtle" onClick={refetchAll}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Share access" withArrow>
            <ActionIcon size="sm" variant="subtle" color="cyan" onClick={openShare}>
              <IconShare size={14} />
            </ActionIcon>
          </Tooltip>
          {canCancel && (
            <Tooltip label="Cancel workflow" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                loading={cancelMutation.isPending}
                onClick={() =>
                  modals.openConfirmModal({
                    title: 'Cancel workflow',
                    children: `Cancel workflow "${timeline.businessKey}"? This action cannot be undone.`,
                    labels: { confirm: 'Cancel workflow', cancel: 'Back' },
                    confirmProps: { color: 'red' },
                    onConfirm: () => cancelMutation.mutate(),
                  })
                }
              >
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Steps */}
      <Stack gap="xs">
        {timeline.steps.map((step, i) => (
          <StepCard
            key={i}
            step={step}
            stepInstance={stepInstanceByOrder.get(step.stepOrder)}
            workflowInstanceId={instanceId}
            currentUsername={user?.username}
            onActionSuccess={refetchAll}
          />
        ))}
      </Stack>

      <ShareModal
        opened={shareOpened}
        onClose={closeShare}
        workflowInstanceId={instanceId}
      />
    </div>
  )
}
