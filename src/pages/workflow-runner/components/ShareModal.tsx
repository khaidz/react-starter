import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconUserX } from '@tabler/icons-react'
import { workflowApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { WorkflowShare } from '@/types/workflow'

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US')
}

// ── Share row ───────────────────────────────────────────────────

function ShareRow({
  share,
  workflowInstanceId,
}: {
  share: WorkflowShare
  workflowInstanceId: number
}) {
  const queryClient = useQueryClient()
  const isActive = !share.revokedAt

  const revokeMutation = useMutation({
    mutationFn: () => workflowApi.revokeShare(workflowInstanceId, share.sharedToUserId),
    onSuccess: () => {
      notifications.show({ message: 'Access revoked', color: 'orange' })
      queryClient.invalidateQueries({ queryKey: ['workflow-shares', workflowInstanceId] })
    },
    onError: (error) => notifyError(error),
  })

  return (
    <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} align="center">
            <Text size="sm" fw={600} truncate>
              {share.sharedToUserId}
            </Text>
            <Badge size="xs" color={isActive ? 'cyan' : 'gray'} variant="light">
              {isActive ? 'Shared' : 'Revoked'}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Shared by {share.sharedBy} at {formatDateTime(share.createdAt)}
          </Text>
          {!isActive && (
            <Text size="xs" c="dimmed">
              Revoked at: {formatDateTime(share.revokedAt)}
            </Text>
          )}
        </div>
        {isActive && (
          <Tooltip label="Revoke access" withArrow>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              loading={revokeMutation.isPending}
              onClick={() =>
                modals.openConfirmModal({
                  title: 'Revoke access',
                  children: `Revoke view access for "${share.sharedToUserId}"?`,
                  labels: { confirm: 'Revoke', cancel: 'Back' },
                  confirmProps: { color: 'red' },
                  onConfirm: () => revokeMutation.mutate(),
                })
              }
            >
              <IconUserX size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────

export function ShareModal({
  opened,
  onClose,
  workflowInstanceId,
}: {
  opened: boolean
  onClose: () => void
  workflowInstanceId: number
}) {
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState('')

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ['workflow-shares', workflowInstanceId],
    queryFn: () => workflowApi.getShares(workflowInstanceId),
    enabled: opened,
  })

  const shareMutation = useMutation({
    mutationFn: () => workflowApi.shareWorkflow(workflowInstanceId, { sharedToUserId: userId.trim() }),
    onSuccess: () => {
      notifications.show({ message: 'Access shared', color: 'teal' })
      queryClient.invalidateQueries({ queryKey: ['workflow-shares', workflowInstanceId] })
      setUserId('')
    },
    onError: (error) => notifyError(error),
  })

  const active = shares.filter((s: WorkflowShare) => !s.revokedAt)
  const revoked = shares.filter((s: WorkflowShare) => s.revokedAt)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Share workflow access"
      size="sm"
    >
      <Stack gap="sm">
        {/* Add share */}
        <Group gap="xs" align="flex-end">
          <TextInput
            label="Share with (User ID)"
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userId.trim()) shareMutation.mutate()
            }}
          />
          <Button
            onClick={() => shareMutation.mutate()}
            loading={shareMutation.isPending}
            disabled={!userId.trim()}
          >
            Share
          </Button>
        </Group>

        {/* List */}
        {isLoading && (
          <Group justify="center" py="md">
            <Loader size="sm" />
          </Group>
        )}

        {!isLoading && shares.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            Not shared with anyone yet.
          </Text>
        )}

        {active.length > 0 && (
          <Stack gap={0}>
            <Text size="xs" fw={600} c="cyan" px="xs" py={4}>
              Shared ({active.length})
            </Text>
            <div style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 6, overflow: 'hidden' }}>
              {active.map((s: WorkflowShare) => (
                <ShareRow key={s.id} share={s} workflowInstanceId={workflowInstanceId} />
              ))}
            </div>
          </Stack>
        )}

        {revoked.length > 0 && (
          <Stack gap={0}>
            <Text size="xs" fw={600} c="dimmed" px="xs" py={4}>
              Revoked ({revoked.length})
            </Text>
            <div style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 6, overflow: 'hidden', opacity: 0.6 }}>
              {revoked.map((s: WorkflowShare) => (
                <ShareRow key={s.id} share={s} workflowInstanceId={workflowInstanceId} />
              ))}
            </div>
          </Stack>
        )}
      </Stack>
    </Modal>
  )
}
