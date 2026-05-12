import { apiKeysApi } from '@/api/api-keys.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { ApiKeyItem, ApiKeyStatus } from '@/types/api'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Pagination,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { ApiKeyModal } from './components/ApiKeyModal'
import { CreatedKeyModal } from './components/CreatedKeyModal'
import { KeyValueCell, formatDate } from './components/KeyValueCell'

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100']

const STATUS_COLOR: Record<ApiKeyStatus, string> = {
  ACTIVE: 'green',
  REVOKED: 'red',
  EXPIRED: 'gray',
}

export function ApiKeyPage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [createdKeyModalOpened, { open: openCreatedModal, close: closeCreatedModal }] =
    useDisclosure(false)
  const [editItem, setEditItem] = useState<ApiKeyItem | null>(null)
  const [createdKey, setCreatedKey] = useState<ApiKeyItem | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filterValues, setFilterValues] = useState({ name: '' })
  const [debouncedName] = useDebouncedValue(filterValues.name, 1000)

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)

  useEffect(() => {
    setPage(1)
  }, [debouncedName, sorting, pageSize])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['api-keys', 'paged', { name: debouncedName, page, pageSize, sort }],
    queryFn: () =>
      apiKeysApi.search({
        name: debouncedName || undefined,
        page,
        size: pageSize,
        sort: sort.length ? sort : undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const apiKeys: ApiKeyItem[] = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      notifications.show({ message: 'API key revoked', color: 'orange' })
    },
    onError: (error) => notifyError(error),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.delete(id),
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

  function handleColumnFilterChange(id: string, value: string | string[]) {
    setFilterValues((prev) => ({ ...prev, [id]: value as string }))
  }

  const columns: TableColumn<ApiKeyItem>[] = [
    {
      id: 'id',
      header: 'ID',
      width: 200,
      accessorFn: (row) => row.id,
      copyable: true,
      cell: (row) => row.id,
    },
    {
      id: 'name',
      header: 'Name',
      enableSorting: true,
      enableColumnFilter: true,
      accessorFn: (row) => row.name,
      filterPlaceholder: 'Search by name...',
      cell: (row) => (
        <Text fw={500} fz="sm">
          {row.name}
        </Text>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => (
        <Text c={row.description ? undefined : 'dimmed'} fz="sm">
          {row.description || '—'}
        </Text>
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
      id: 'allowedPermissions',
      header: 'Permissions',
      cell: (row) =>
        row.allowedPermissions?.length > 0 ? (
          <Group gap={4} wrap="wrap">
            {row.allowedPermissions.map((p) => (
              <Badge
                key={p.id}
                size="xs"
                variant="outline"
                color="violet"
                style={{ textTransform: 'inherit' }}
              >
                {p.name}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text size="sm" c="dimmed" fs="italic">
            unrestricted
          </Text>
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
      enableSorting: true,
      accessorFn: (row) => row.createdAt,
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
    <>
      <title>API Key Management</title>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={3}>API Key Management</Title>
        </Group>

        <DataTable
          columns={columns}
          data={apiKeys}
          keyField="id"
          loading={isLoading}
          emptyText="No API keys found"
          sorting={sorting}
          onSortingChange={setSorting}
          onRefresh={() => refetch()}
          refreshing={isFetching && !isLoading}
          columnFilterValues={filterValues}
          onColumnFilterChange={handleColumnFilterChange}
          toolbar={
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
              Create Key
            </Button>
          }
          footer={
            totalElements > 0 && (
              <Group justify="space-between" align="center">
                <Group gap="xs" align="center">
                  <Text size="sm" c="dimmed">
                    Rows per page:
                  </Text>
                  <Select
                    size="xs"
                    w={70}
                    data={PAGE_SIZE_OPTIONS}
                    value={String(pageSize)}
                    onChange={(v) => v && setPageSize(Number(v))}
                    allowDeselect={false}
                  />
                  <Text size="sm" c="dimmed">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)} of{' '}
                    {totalElements}
                  </Text>
                </Group>
                {totalPages > 1 && (
                  <Pagination size="sm" total={totalPages} value={page} onChange={setPage} />
                )}
              </Group>
            )
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
    </>
  )
}
