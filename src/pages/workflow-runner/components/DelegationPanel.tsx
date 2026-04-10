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
import { DateTimePicker } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconPlus, IconX } from '@tabler/icons-react'
import { workflowApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { Delegation } from '@/types/workflow'
import styles from '../workflow-runner.module.scss'

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US')
}

// ── Create delegation modal ─────────────────────────────────────

function CreateDelegationModal({
  opened,
  onClose,
}: {
  opened: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [delegateeId, setDelegateeId] = useState('')
  const [startAt, setStartAt] = useState<Date | null>(new Date())
  const [endAt, setEndAt] = useState<Date | null>(null)

  const createMutation = useMutation({
    mutationFn: () =>
      workflowApi.createDelegation({
        delegateeId: delegateeId.trim(),
        startAt: startAt!.toISOString(),
        endAt: endAt ? endAt.toISOString() : null,
      }),
    onSuccess: () => {
      notifications.show({ message: 'Delegation created', color: 'green' })
      queryClient.invalidateQueries({ queryKey: ['my-delegations'] })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    setDelegateeId('')
    setStartAt(new Date())
    setEndAt(null)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Create New Delegation" size="sm">
      <Stack gap="sm">
        <TextInput
          label="Delegate to (User ID)"
          placeholder="Enter delegatee user ID"
          value={delegateeId}
          onChange={(e) => setDelegateeId(e.target.value)}
          required
        />
        <DateTimePicker
          label="Effective from"
          placeholder="Select start time"
          value={startAt}
          onChange={setStartAt}
          required
        />
        <DateTimePicker
          label="Effective until (leave blank for indefinite)"
          placeholder="Select end time"
          value={endAt}
          onChange={setEndAt}
          clearable
          minDate={startAt ?? undefined}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!delegateeId.trim() || !startAt}
          >
            Create
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// ── Delegation row ──────────────────────────────────────────────

function DelegationRow({ delegation }: { delegation: Delegation }) {
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: () => workflowApi.cancelDelegation(delegation.id),
    onSuccess: () => {
      notifications.show({ message: 'Delegation cancelled', color: 'orange' })
      queryClient.invalidateQueries({ queryKey: ['my-delegations'] })
    },
    onError: (error) => notifyError(error),
  })

  return (
    <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={4}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} align="center">
            <Text size="sm" fw={600} truncate>
              → {delegation.delegateeId}
            </Text>
            <Badge size="xs" color={delegation.active ? 'green' : 'gray'} variant="light">
              {delegation.active ? 'Active' : 'Cancelled'}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            From: {formatDateTime(delegation.startAt)}
          </Text>
          <Text size="xs" c="dimmed">
            Until: {delegation.endAt ? formatDateTime(delegation.endAt) : 'Indefinite'}
          </Text>
        </div>
        {delegation.active && (
          <Tooltip label="Cancel delegation" withArrow>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              loading={cancelMutation.isPending}
              onClick={() =>
                modals.openConfirmModal({
                  title: 'Cancel delegation',
                  children: `Cancel delegation for "${delegation.delegateeId}"?`,
                  labels: { confirm: 'Cancel delegation', cancel: 'Back' },
                  confirmProps: { color: 'red' },
                  onConfirm: () => cancelMutation.mutate(),
                })
              }
            >
              <IconX size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </div>
  )
}

// ── Panel ───────────────────────────────────────────────────────

export function DelegationPanel() {
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)

  const { data: delegations = [], isLoading } = useQuery({
    queryKey: ['my-delegations'],
    queryFn: workflowApi.getMyDelegations,
  })

  const active = delegations.filter((d) => d.active)
  const inactive = delegations.filter((d) => !d.active)

  return (
    <div className={styles.detailCard}>
      <Group justify="space-between" align="center">
        <div>
          <Text fw={700} size="md">Delegation Management</Text>
          <Text size="xs" c="dimmed">Delegate your tasks to someone else while you are away</Text>
        </div>
        <Button size="xs" leftSection={<IconPlus size={13} />} onClick={openCreate}>
          New Delegation
        </Button>
      </Group>

      {isLoading && (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      )}

      {!isLoading && delegations.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No delegations yet.
        </Text>
      )}

      {active.length > 0 && (
        <Stack gap={0}>
          <Text size="xs" fw={600} c="green" px="xs" py={4}>
            Active ({active.length})
          </Text>
          <div style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 6, overflow: 'hidden' }}>
            {active.map((d) => (
              <DelegationRow key={d.id} delegation={d} />
            ))}
          </div>
        </Stack>
      )}

      {inactive.length > 0 && (
        <Stack gap={0}>
          <Text size="xs" fw={600} c="dimmed" px="xs" py={4}>
            Cancelled ({inactive.length})
          </Text>
          <div style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 6, overflow: 'hidden', opacity: 0.6 }}>
            {inactive.map((d) => (
              <DelegationRow key={d.id} delegation={d} />
            ))}
          </div>
        </Stack>
      )}

      <CreateDelegationModal opened={createOpened} onClose={closeCreate} />
    </div>
  )
}
