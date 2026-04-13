import { apiKeysApi, type CreateApiKeyPayload, type UpdateApiKeyPayload } from '@/api/api-keys.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { ApiKeyItem, ApiKeyStatus } from '@/types/api'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Code,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconEdit,
  IconKey,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

// ── Constants ────────────────────────────────────────────────────

const STATUS_COLOR: Record<ApiKeyStatus, string> = {
  ACTIVE: 'green',
  REVOKED: 'red',
  EXPIRED: 'gray',
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Format Date thành local datetime string (không có Z) để gửi lên backend LocalDateTime */
function toLocalISOString(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

// ── Key Value display ────────────────────────────────────────────

function KeyValueCell({ value }: { value: string }) {
  const masked = value.slice(0, 10) + '•'.repeat(16)
  return (
    <Group gap={6} wrap="nowrap">
      <Code fz="xs" style={{ letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
        {masked}
      </Code>
      <CopyButton value={value} timeout={1500}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy key'} withArrow>
            <ActionIcon size="xs" variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
              {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  )
}

// ── Created Key Modal ────────────────────────────────────────────

interface CreatedKeyModalProps {
  opened: boolean
  onClose: () => void
  apiKey: ApiKeyItem | null
}

function CreatedKeyModal({ opened, onClose, apiKey }: CreatedKeyModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="API Key Created" centered size="md">
      <Stack>
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
          Copy your API key now — it will be masked after you close this dialog.
        </Alert>
        <Stack gap={4}>
          <Text size="sm" fw={500}>Key Name</Text>
          <Text size="sm">{apiKey?.name}</Text>
        </Stack>
        <Stack gap={4}>
          <Text size="sm" fw={500}>API Key</Text>
          <Group gap={8} wrap="nowrap">
            <Code
              block
              style={{ flex: 1, wordBreak: 'break-all', fontSize: '0.78rem', userSelect: 'all' }}
            >
              {apiKey?.keyValue}
            </Code>
            <CopyButton value={apiKey?.keyValue ?? ''} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
                  <ActionIcon
                    size="lg"
                    variant={copied ? 'filled' : 'light'}
                    color={copied ? 'green' : 'blue'}
                    onClick={copy}
                    style={{ flexShrink: 0 }}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Stack>
        <Group justify="flex-end" mt="xs">
          <Button onClick={onClose}>Done</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// ── API Key Form Modal ───────────────────────────────────────────

interface ApiKeyModalProps {
  opened: boolean
  onClose: () => void
  editItem?: ApiKeyItem | null
  onCreated: (key: ApiKeyItem) => void
}

function ApiKeyModal({ opened, onClose, editItem, onCreated }: ApiKeyModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const EXPIRE_PRESETS = [
    { label: '1 day',   days: 1 },
    { label: '3 days',  days: 3 },
    { label: '7 days',  days: 7 },
    { label: '30 days', days: 30 },
  ]

  function daysFromNow(days: number): Date {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d
  }

  const form = useForm<{
    name: string
    description: string
    expiresAt: Date | null
  }>({
    initialValues: { name: '', description: '', expiresAt: null },
    validate: {
      name: (v) => (!v?.trim() ? 'Name is required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({
          name: editItem.name,
          description: editItem.description ?? '',
          expiresAt: editItem.expiresAt ? new Date(editItem.expiresAt) : null,
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => apiKeysApi.create(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      handleClose()
      onCreated(created)
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateApiKeyPayload) => apiKeysApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      notifications.show({ message: 'API key updated successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: typeof form.values) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      expiresAt: toLocalISOString(values.expiresAt),
    }
    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit API Key' : 'Create API Key'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Name"
            placeholder="e.g. Mobile App Key"
            withAsterisk
            {...form.getInputProps('name')}
          />
          <Textarea
            label="Description"
            placeholder="What this key is used for..."
            rows={3}
            {...form.getInputProps('description')}
          />
          <Stack gap={6}>
            <Group gap={6}>
              {EXPIRE_PRESETS.map((p) => (
                <Button
                  key={p.days}
                  size="xs"
                  variant="default"
                  onClick={() => form.setFieldValue('expiresAt', daysFromNow(p.days))}
                >
                  +{p.label}
                </Button>
              ))}
            </Group>
            <DateTimePicker
              label="Expires At"
              placeholder="No expiration"
              clearable
              valueFormat="DD/MM/YYYY HH:mm"
              minDate={new Date()}
              {...form.getInputProps('expiresAt')}
            />
          </Stack>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

// ── Main Page ────────────────────────────────────────────────────

export function ApiKeyPage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [createdKeyModalOpened, { open: openCreatedModal, close: closeCreatedModal }] =
    useDisclosure(false)
  const [editItem, setEditItem] = useState<ApiKeyItem | null>(null)
  const [createdKey, setCreatedKey] = useState<ApiKeyItem | null>(null)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.getAll(),
  })

  const apiKeys: ApiKeyItem[] = data ?? []

  const revokeMutation = useMutation({
    mutationFn: (id: number) => apiKeysApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      notifications.show({ message: 'API key revoked', color: 'orange' })
    },
    onError: (error) => notifyError(error),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      notifications.show({ message: 'API key deleted', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  function handleAdd() {
    setEditItem(null)
    openModal()
  }

  function handleEdit(item: ApiKeyItem) {
    setEditItem(item)
    openModal()
  }

  function handleCreated(key: ApiKeyItem) {
    setCreatedKey(key)
    openCreatedModal()
  }

  function handleRevoke(item: ApiKeyItem) {
    modals.openConfirmModal({
      title: 'Revoke API Key',
      children: (
        <Text size="sm">
          Revoke <strong>{item.name}</strong>? This key will no longer be accepted.
        </Text>
      ),
      labels: { confirm: 'Revoke', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: () => revokeMutation.mutate(item.id),
    })
  }

  function handleDelete(item: ApiKeyItem) {
    modals.openConfirmModal({
      title: 'Delete API Key',
      children: (
        <Text size="sm">
          Delete <strong>{item.name}</strong>? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(item.id),
    })
  }

  const columns: TableColumn<ApiKeyItem>[] = [
    {
      id: 'id',
      header: 'ID',
      width: 60,
      align: 'center',
      cell: (row) => row.id,
    },
    {
      id: 'name',
      header: 'Name',
      enableSorting: true,
      enableColumnFilter: true,
      accessorFn: (row) => row.name,
      filterPlaceholder: 'Search by name...',
      cell: (row) => <Text fw={500}>{row.name}</Text>,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => (
        <Text c={row.description ? undefined : 'dimmed'}>{row.description || '—'}</Text>
      ),
    },
    {
      id: 'keyValue',
      header: 'API Key',
      minWidth: 260,
      cell: (row) => <KeyValueCell value={row.keyValue} />,
    },
    {
      id: 'status',
      header: 'Status',
      width: 90,
      align: 'center',
      cell: (row) => (
        <Badge size="sm" variant="light" color={STATUS_COLOR[row.status]}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: 'expiresAt',
      header: 'Expires At',
      width: 150,
      cell: (row) => (
        <Text size="sm" c={row.expired ? 'red' : undefined}>
          {formatDate(row.expiresAt)}
        </Text>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created At',
      width: 150,
      cell: (row) => <Text size="sm">{formatDate(row.createdAt)}</Text>,
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 120,
      align: 'center',
      cell: (row) => (
        <Group gap={4} justify="center" wrap="nowrap">
          <Tooltip label="Edit" withArrow>
            <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEdit(row)}>
              <IconEdit size={15} />
            </ActionIcon>
          </Tooltip>
          {row.status === 'ACTIVE' && (
            <Tooltip label="Revoke" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="orange"
                loading={revokeMutation.isPending}
                onClick={() => handleRevoke(row)}
              >
                <IconX size={15} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Delete" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              loading={deleteMutation.isPending}
              onClick={() => handleDelete(row)}
            >
              <IconTrash size={15} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ]

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={3}>API Key Management</Title>
      </Group>

      <DataTable
        columns={columns}
        data={apiKeys}
        keyField="id"
        loading={isLoading}
        emptyText="No API keys found"
        onRefresh={() => refetch()}
        refreshing={isFetching && !isLoading}
        toolbar={
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
            Create Key
          </Button>
        }
      />

      <ApiKeyModal
        opened={modalOpened}
        onClose={closeModal}
        editItem={editItem}
        onCreated={handleCreated}
      />

      <CreatedKeyModal
        opened={createdKeyModalOpened}
        onClose={closeCreatedModal}
        apiKey={createdKey}
      />
    </Stack>
  )
}
