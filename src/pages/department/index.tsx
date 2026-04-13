import {
  departmentsApi,
  type CreateDepartmentPayload,
  type UpdateDepartmentPayload,
} from '@/api/departments.api'
import { DataTable, type TableColumn } from '@/components/data-table'
import { notifyError } from '@/lib/notify'
import type { DepartmentItem, DepartmentTreeNode } from '@/types/api'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconList,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconTree,
} from '@tabler/icons-react'
import { useDebouncedValue } from '@mantine/hooks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import styles from './department.module.scss'

// ── Tree filter helper ───────────────────────────────────────────

function filterTree(nodes: DepartmentTreeNode[], keyword: string): DepartmentTreeNode[] {
  if (!keyword) return nodes
  const kw = keyword.toLowerCase()

  function matchNode(node: DepartmentTreeNode): DepartmentTreeNode | null {
    const selfMatch =
      node.name.toLowerCase().includes(kw) || node.code.toLowerCase().includes(kw)

    if (selfMatch) {
      // Node khớp → giữ nguyên toàn bộ cây con bên dưới
      return node
    }

    // Node không khớp → chỉ giữ lại nếu có hậu duệ khớp (hiển thị đường dẫn đến node khớp)
    const filteredChildren = node.children
      .map(matchNode)
      .filter((n): n is DepartmentTreeNode => n !== null)

    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren }
    }

    return null
  }

  return nodes.map(matchNode).filter((n): n is DepartmentTreeNode => n !== null)
}

// ── Department Form Modal ────────────────────────────────────────

interface DepartmentModalProps {
  opened: boolean
  onClose: () => void
  editItem?: DepartmentItem | null
}

function DepartmentModal({ opened, onClose, editItem }: DepartmentModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const { data: allDepts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    staleTime: 60_000,
  })

  const parentOptions = allDepts
    .filter((d) => d.id !== editItem?.id)
    .map((d) => ({
      value: String(d.id),
      label: d.path ? `${d.path} / ${d.name}` : d.name,
    }))

  const form = useForm<{
    name: string
    code: string
    description: string
    parentId: string | null
    isActive: boolean
  }>({
    initialValues: { name: '', code: '', description: '', parentId: null, isActive: true },
    validate: {
      name: (v) => (!v?.trim() ? 'Department name is required' : null),
      code: (v) => (!v?.trim() ? 'Department code is required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({
          name: editItem.name,
          code: editItem.code,
          description: editItem.description ?? '',
          parentId: editItem.parent?.id != null ? String(editItem.parent.id) : null,
          isActive: editItem.active,
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => departmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      notifications.show({ message: 'Department created successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) => departmentsApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      notifications.show({ message: 'Department updated successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: typeof form.values) {
    if (isEdit) {
      updateMutation.mutate({
        parentId: values.parentId ? Number(values.parentId) : null,
        name: values.name,
        code: values.code,
        isActive: values.isActive,
      })
    } else {
      createMutation.mutate({
        parentId: Number(values.parentId),
        name: values.name,
        code: values.code,
        description: values.description,
        isActive: values.isActive,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit Department' : 'Add Department'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Parent Department"
            placeholder="— Root (no parent) —"
            data={parentOptions}
            searchable
            clearable
            {...form.getInputProps('parentId')}
          />
          <TextInput
            label="Department Name"
            placeholder="e.g. Engineering"
            withAsterisk
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Department Code"
            placeholder="e.g. ENG"
            withAsterisk
            {...form.getInputProps('code')}
          />
          {!isEdit && (
            <TextInput
              label="Description"
              placeholder="Brief description"
              {...form.getInputProps('description')}
            />
          )}
          <Checkbox label="Active" {...form.getInputProps('isActive', { type: 'checkbox' })} />
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

// ── Highlight matching text ──────────────────────────────────────

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <>{text}</>
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>{text.slice(idx, idx + keyword.length)}</mark>
      {text.slice(idx + keyword.length)}
    </>
  )
}

// ── Tree node ────────────────────────────────────────────────────

interface TreeNodeRowProps {
  node: DepartmentTreeNode
  isLast: boolean
  parentPrefix: string
  keyword: string
  onEdit: (id: number) => void
  onDelete: (node: DepartmentTreeNode) => void
  deletePending: boolean
}

function TreeNodeRow({
  node,
  isLast,
  parentPrefix,
  keyword,
  onEdit,
  onDelete,
  deletePending,
}: TreeNodeRowProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  const connector = isLast ? '└─' : '├─'
  const childPrefix = parentPrefix + (isLast ? '\u00a0\u00a0\u00a0' : '│\u00a0\u00a0')

  return (
    <>
      <div className={styles.treeRow}>
        <div className={styles.treeIndent}>
          <span className={styles.treePrefix}>
            {parentPrefix}
            {connector}
          </span>
          {hasChildren ? (
            <ActionIcon
              size={16}
              variant="subtle"
              color="gray"
              onClick={() => setExpanded((v) => !v)}
              className={styles.expandBtn}
            >
              {expanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
            </ActionIcon>
          ) : (
            <span className={styles.leafDot} />
          )}
        </div>

        <div className={styles.treeContent}>
          <Text size="sm" fw={500} style={{ flex: 1 }}>
            <HighlightText text={node.name} keyword={keyword} />
          </Text>
          <Text size="xs" ff="monospace" c="dimmed" w={90}>
            <HighlightText text={node.code} keyword={keyword} />
          </Text>
          <Badge
            size="xs"
            variant="light"
            color={node.isActive ? 'green' : 'gray'}
            w={58}
            style={{ flexShrink: 0 }}
          >
            {node.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onEdit(node.id)}>
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                loading={deletePending}
                onClick={() => onDelete(node)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              isLast={idx === node.children.length - 1}
              parentPrefix={childPrefix}
              keyword={keyword}
              onEdit={onEdit}
              onDelete={onDelete}
              deletePending={deletePending}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ── Tree view ────────────────────────────────────────────────────

interface DepartmentTreeViewProps {
  treeRoot: DepartmentTreeNode | null
  isLoading: boolean
  isFetching: boolean
  onRefresh: () => void
  onAdd: () => void
  onEdit: (id: number) => void
  onDelete: (node: DepartmentTreeNode) => void
  deletePending: boolean
  viewToggle: React.ReactNode
}

function DepartmentTreeView({
  treeRoot,
  isLoading,
  isFetching,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
  deletePending,
  viewToggle,
}: DepartmentTreeViewProps) {
  const [search, setSearch] = useState('')
  const [keyword] = useDebouncedValue(search, 300)

  // API trả về 1 root node chứa tất cả; lấy children của root để render
  const topNodes: DepartmentTreeNode[] = treeRoot?.children ?? (treeRoot ? [treeRoot] : [])

  const visibleNodes = useMemo(() => filterTree(topNodes, keyword), [topNodes, keyword])

  return (
    <div className={styles.treeWrapper}>
      <div className={styles.treeToolbar}>
        <div className={styles.treeToolbarLeft}>
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={onAdd}>
            Add New
          </Button>
          <TextInput
            size="xs"
            placeholder="Search name or code..."
            leftSection={<IconSearch size={13} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={200}
          />
        </div>
        <div className={styles.treeToolbarRight}>
          <Tooltip label="Refresh" withArrow position="left">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onRefresh}
              loading={isFetching && !isLoading}
              aria-label="Refresh"
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          {viewToggle}
        </div>
      </div>

      <div className={styles.treeBody}>
        {isLoading ? (
          <div className={styles.treeState}>
            <Loader size="sm" color="vibBlue" />
          </div>
        ) : visibleNodes.length === 0 ? (
          <div className={styles.treeState}>
            <Text size="sm" c="dimmed">
              {search ? 'No departments match your search' : 'No departments found'}
            </Text>
          </div>
        ) : (
          <Box p="md">
            {visibleNodes.map((node, idx) => (
              <TreeNodeRow
                key={node.id}
                node={node}
                isLast={idx === visibleNodes.length - 1}
                parentPrefix=""
                keyword={keyword}
                onEdit={onEdit}
                onDelete={onDelete}
                deletePending={deletePending}
              />
            ))}
          </Box>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────

type ViewMode = 'list' | 'tree'

export function DepartmentPage() {
  const queryClient = useQueryClient()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editItem, setEditItem] = useState<DepartmentItem | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // List query (flat)
  const {
    data: listData,
    isLoading: listLoading,
    isFetching: listFetching,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    enabled: viewMode === 'list',
  })

  // Tree query (nested from API)
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

  const departments: DepartmentItem[] = listData ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: number) => departmentsApi.delete(id, { cascade: false }),
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

  // Edit from list view: item already available
  function handleEdit(item: DepartmentItem) {
    setEditItem(item)
    openModal()
  }

  // Edit from tree view: fetch detail by id
  function handleEditById(id: number) {
    departmentsApi.getById(id).then((item) => {
      setEditItem(item)
      openModal()
    })
  }

  function handleDelete(item: { id: number; name: string }) {
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
    {
      id: 'id',
      header: 'ID',
      width: 70,
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
      cell: (row) => <Text>{row.name}</Text>,
    },
    {
      id: 'code',
      header: 'Code',
      enableSorting: true,
      enableColumnFilter: true,
      accessorFn: (row) => row.code,
      filterPlaceholder: 'Search by code...',
      cell: (row) => <Text ff="monospace">{row.code}</Text>,
    },
    {
      id: 'path',
      header: 'Path',
      cell: (row) => (
        <Text size="sm" c={row.path ? undefined : 'dimmed'}>
          {row.path || '—'}
        </Text>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => (
        <Text c={row.description ? undefined : 'dimmed'}>{row.description || '—'}</Text>
      ),
    },
    {
      id: 'active',
      header: 'Status',
      width: 90,
      align: 'center',
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
    <Stack gap="md">
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
          onRefresh={() => refetchList()}
          refreshing={listFetching && !listLoading}
          toolbar={
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
              Add New
            </Button>
          }
          toolbarRight={viewToggle}
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
  )
}
