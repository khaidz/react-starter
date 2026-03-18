import { departmentsApi } from '@/api/departments.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { DepartmentItem } from '@/types/api'
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
import type { SortingState } from '@tanstack/react-table'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconList, IconPlus, IconTrash, IconTree } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { DepartmentModal } from './components/DepartmentModal'
import { DepartmentTreeView } from './components/DepartmentTreeView'

type ViewMode = 'list' | 'tree'

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100']

const STATUS_FILTER_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export function DepartmentPage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<DepartmentItem | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [sorting, setSorting] = useState<SortingState>([])
  const [filterValues, setFilterValues] = useState({ name: '', code: '', active: '' })
  const [debouncedName] = useDebouncedValue(filterValues.name, 1000)
  const [debouncedCode] = useDebouncedValue(filterValues.code, 1000)

  const sort = sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`)

  useEffect(() => {
    setPage(1)
  }, [debouncedName, debouncedCode, filterValues.active, sorting, pageSize])

  function handleColumnFilterChange(id: string, value: string | string[]) {
    setFilterValues((prev) => ({ ...prev, [id]: value as string }))
  }

  const activeParam =
    filterValues.active === 'true' ? true : filterValues.active === 'false' ? false : undefined

  const {
    data: listData,
    isLoading: listLoading,
    isFetching: listFetching,
    refetch: refetchList,
  } = useQuery({
    queryKey: [
      'departments',
      'paged',
      { name: debouncedName, code: debouncedCode, active: filterValues.active, page, pageSize, sort },
    ],
    queryFn: () =>
      departmentsApi.searchPaged({
        name: debouncedName || undefined,
        code: debouncedCode || undefined,
        active: activeParam,
        page: page,
        size: pageSize,
        sort: sort.length ? sort : undefined,
      }),
    enabled: viewMode === 'list',
    placeholderData: keepPreviousData,
  })

  const {
    data: treeData,
    isLoading: treeLoading,
    isFetching: treeFetching,
    refetch: refetchTree,
  } = useQuery({
    queryKey: ['departments', 'tree'],
    queryFn: () => departmentsApi.getTree(),
    enabled: viewMode === 'tree',
  })

  const departments: DepartmentItem[] = listData?.content ?? []
  const totalPages = listData?.totalPages ?? 1
  const totalElements = listData?.totalElements ?? 0

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id, { cascade: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      notifications.show({ message: 'Department deleted successfully', color: 'green' })
    },
    onError: (error) => notifyError(error),
  })

  function handleAdd() {
    setEditItem(null)
    openModal()
  }

  function handleEdit(item: DepartmentItem) {
    setEditItem(item)
    openModal()
  }

  function handleEditById(id: string) {
    departmentsApi.getById(id).then((item) => {
      setEditItem(item)
      openModal()
    })
  }

  function handleDelete(item: { id: string; name: string }) {
    modals.openConfirmModal({
      title: 'Delete Department',
      children: (
        <Text size="sm">
          Are you sure you want to delete department <strong>{item.name}</strong>? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(item.id),
    })
  }

  const viewToggle = (
    <Group gap={4}>
      <Tooltip label="List view" withArrow position="left">
        <ActionIcon
          variant={viewMode === 'list' ? 'light' : 'subtle'}
          color={viewMode === 'list' ? 'blue' : 'gray'}
          onClick={() => setViewMode('list')}
          aria-label="List view"
        >
          <IconList size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Tree view" withArrow position="left">
        <ActionIcon
          variant={viewMode === 'tree' ? 'light' : 'subtle'}
          color={viewMode === 'tree' ? 'blue' : 'gray'}
          onClick={() => setViewMode('tree')}
          aria-label="Tree view"
        >
          <IconTree size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )

  const columns: TableColumn<DepartmentItem>[] = [
    { id: 'id', header: 'ID', width: 200, accessorFn: (row) => row.id, copyable: true, cell: (row) => row.id },
    {
      id: 'name',
      header: 'Name',
      width: 200,
      enableSorting: true,
      enableColumnFilter: true,
      filterPlaceholder: 'Name...',
      accessorFn: (row) => row.name,
      cell: (row) => row.name,
    },
    {
      id: 'code',
      header: 'Code',
      width: 150,
      enableSorting: true,
      enableColumnFilter: true,
      filterPlaceholder: 'Code...',
      accessorFn: (row) => row.code,
      cell: (row) => row.code,
    },
    {
      id: 'description',
      header: 'Description',
      width: 200,
      cell: (row) => (
        <Text c={row.description ? undefined : 'dimmed'}>{row.description || '—'}</Text>
      ),
    },
    {
      id: 'ownerUsername',
      header: 'Owner',
      width: 200,
      cell: (row) => (
        <Text c={row.ownerUsername ? undefined : 'dimmed'}>{row.ownerUsername || '—'}</Text>
      ),
    },
    {
      id: 'active',
      header: 'Status',
      width: 90,
      align: 'center',
      enableColumnFilter: true,
      filterType: 'select',
      filterPlaceholder: 'All...',
      filterOptions: STATUS_FILTER_OPTIONS,
      accessorFn: (row) => (row.active ? 'true' : 'false'),
      cell: (row) =>
        row.active ? (
          <Badge size="sm" color="green" variant="light">
            Active
          </Badge>
        ) : (
          <Badge size="sm" color="gray" variant="light">
            Inactive
          </Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 100,
      align: 'center',
      cell: (row) => (
        <Group gap={4} justify="center" wrap="nowrap">
          <Tooltip label="Edit" withArrow>
            <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEdit(row)}>
              <IconEdit size={15} />
            </ActionIcon>
          </Tooltip>
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
    <title>Department Management</title>
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Title order={3}>Department Management</Title>
      </Group>

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={departments}
          keyField="id"
          loading={listLoading}
          emptyText="No departments found"
          sorting={sorting}
          onSortingChange={setSorting}
          onRefresh={() => refetchList()}
          refreshing={listFetching && !listLoading}
          columnFilterValues={filterValues}
          onColumnFilterChange={handleColumnFilterChange}
          toolbar={
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
              Add New
            </Button>
          }
          toolbarRight={viewToggle}
          footer={
            totalElements > 0 && (
              <Group justify="space-between" align="center">
                <Group gap="xs" align="center">
                  <Text size="sm" c="dimmed">Rows per page:</Text>
                  <Select
                    size="xs"
                    w={70}
                    data={PAGE_SIZE_OPTIONS}
                    value={String(pageSize)}
                    onChange={(v) => v && setPageSize(Number(v))}
                    allowDeselect={false}
                  />
                  <Text size="sm" c="dimmed">
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)} of {totalElements}
                  </Text>
                </Group>
                {totalPages > 1 && (
                  <Pagination size="sm" total={totalPages} value={page} onChange={setPage} />
                )}
              </Group>
            )
          }
        />
      ) : (
        <DepartmentTreeView
          treeRoot={treeData ?? null}
          isLoading={treeLoading}
          isFetching={treeFetching}
          onRefresh={() => refetchTree()}
          onAdd={handleAdd}
          onEdit={handleEditById}
          onDelete={handleDelete}
          deletePending={deleteMutation.isPending}
          viewToggle={viewToggle}
        />
      )}

      <DepartmentModal opened={modalOpened} onClose={closeModal} editItem={editItem} />
    </Stack>
    </>
  )
}
