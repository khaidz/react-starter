import { useState } from 'react'
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Menu,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconAt,
  IconDotsVertical,
  IconEdit,
  IconSearch,
  IconShieldCheck,
  IconTableExport,
  IconTrash,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'
import { usersApi } from '@/api/users.api'
import { exportToCsv } from '@/lib/export'
import { DataTable } from '@/components/data-table'
import type { SortOrder, TableColumn } from '@/components/data-table'
import type { UserItem } from '@/types/api'
import { AddUserModal } from './components/AddUserModal'
import { EditUserModal } from './components/EditUserModal'
import styles from './users.module.scss'

const STATUS_CONFIG = {
  ACTIVE:  { label: 'Hoạt động', color: 'green'  },
  PENDING: { label: 'Chờ duyệt', color: 'yellow' },
  LOCKED:  { label: 'Đã khoá',   color: 'orange' },
  DELETED: { label: 'Đã xoá',    color: 'red'    },
} as const

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'blue', MANAGER: 'orange', USER: 'gray',
}

const PAGE_SIZE = 10

interface SearchParams {
  username: string
  email: string
  status: string | null
}

export function UsersPage() {
  const [opened, { open, close }] = useDisclosure(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)

  // Draft — giá trị đang nhập
  const [draftUsername, setDraftUsername] = useState('')
  const [draftEmail, setDraftEmail]       = useState('')
  const [draftStatus, setDraftStatus]     = useState<string | null>(null)

  // Committed — chỉ thay đổi khi nhấn Search / Reset
  const [params, setParams] = useState<SearchParams>({ username: '', email: '', status: null })

  // Pagination & sort — thay đổi ngay lập tức
  const [page, setPage]           = useState(1)
  const [sortBy, setSortBy]       = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const queryClient = useQueryClient()

  function handleSearch() {
    setParams({ username: draftUsername, email: draftEmail, status: draftStatus })
    setPage(1)
  }

  function handleReset() {
    setDraftUsername(''); setDraftEmail(''); setDraftStatus(null)
    setParams({ username: '', email: '', status: null })
    setPage(1)
  }

  function handleSort(key: string, order: SortOrder) {
    setSortBy(key)
    setSortOrder(order)
    setPage(1)
  }

  const sortParam = sortBy ? [`${sortBy},${sortOrder}`] : undefined

  const { data: paged, isFetching } = useQuery({
    queryKey: ['users', params, page, sortBy, sortOrder],
    queryFn: () => usersApi.search({
      username: params.username || undefined,
      email:    params.email    || undefined,
      status:   params.status   || undefined,
      page:     page - 1,
      size:     PAGE_SIZE,
      sort:     sortParam,
    }),
    placeholderData: (prev) => prev,
  })

  const allUsers    = paged?.content ?? []
  const totalPages  = paged?.totalPages ?? 1
  const totalElements = paged?.totalElements ?? 0

  const { mutate: deleteUser } = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const hasFilter = !!params.username || !!params.email || !!params.status

  const columns: TableColumn<UserItem>[] = [
    {
      key: 'username',
      title: 'Người dùng',
      minWidth: 220,
      sortable: true,
      render: (r) => (
        <div className={styles.userCell}>
          <Avatar size={36} radius="xl" color="orange">
            {r.username[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div className={styles.userName}>{r.username}</div>
            <div className={styles.userEmail}>{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'deptName',
      title: 'Phòng ban',
      minWidth: 150,
      sortable: true,
      render: (r) => <Text size="sm">{r.deptName ?? '—'}</Text>,
    },
    {
      key: 'roles',
      title: 'Vai trò',
      minWidth: 140,
      render: (r) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {r.roles.length > 0
            ? r.roles.map((role) => (
                <Badge key={role} color={ROLE_COLORS[role] ?? 'gray'} variant="light" size="sm" radius="sm">
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </Badge>
              ))
            : <Text size="sm" c="dimmed">—</Text>
          }
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      minWidth: 110,
      align: 'center',
      render: (r) => (
        <Badge color={STATUS_CONFIG[r.status]?.color ?? 'gray'} variant="dot" size="sm">
          {STATUS_CONFIG[r.status]?.label ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      width: 50,
      align: 'center',
      render: (r) => (
        <Menu shadow="md" width={160} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="sm" radius="md">
              <IconDotsVertical size={15} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => setEditingUser(r)}>Chỉnh sửa</Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => deleteUser(r.id)}
            >
              Xóa
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ]

  return (
    <Stack gap="lg">
      <AddUserModal opened={opened} onClose={close} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />

      {/* ── Title row ── */}
      <Group justify="space-between" align="flex-start">
        <div>
          <Text className={styles.pageTitle}>Quản lý người dùng</Text>
          <Text className={styles.pageSubtitle}>Quản lý tài khoản và phân quyền người dùng trong hệ thống</Text>
        </div>
        <Group gap="sm">
          <Button
            leftSection={<IconTableExport size={15} />}
            size="sm"
            radius="md"
            disabled={allUsers.length === 0}
            onClick={() =>
              exportToCsv(
                `users_${new Date().toISOString().slice(0, 10)}`,
                allUsers.map((u) => ({
                  'Tên đăng nhập': u.username,
                  'Email':         u.email,
                  'Vai trò':       u.roles.join(', '),
                  'Phòng ban':     u.deptName ?? '',
                  'Trạng thái':    STATUS_CONFIG[u.status]?.label ?? u.status,
                })),
              )
            }
          >
            Xuất Excel
          </Button>
          <Button leftSection={<IconUserPlus size={15} />} size="sm" radius="md" color="vibOrange" onClick={open}>
            Thêm mới
          </Button>
        </Group>
      </Group>

      {/* ── Filters ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterItem}>
          <Text className={styles.filterLabel}>Tên đăng nhập</Text>
          <TextInput
            placeholder="Nhập username..."
            leftSection={<IconUser size={14} color="#6b7280" />}
            value={draftUsername}
            onChange={(e) => setDraftUsername(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            radius="md"
            size="sm"
          />
        </div>
        <div className={styles.filterItem}>
          <Text className={styles.filterLabel}>Email</Text>
          <TextInput
            placeholder="Nhập email..."
            leftSection={<IconAt size={14} color="#6b7280" />}
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            radius="md"
            size="sm"
          />
        </div>
        <div className={styles.filterItem}>
          <Text className={styles.filterLabel}>Trạng thái</Text>
          <Select
            placeholder="Tất cả trạng thái"
            leftSection={<IconShieldCheck size={14} color="#6b7280" />}
            data={STATUS_OPTIONS}
            value={draftStatus}
            onChange={setDraftStatus}
            clearable
            radius="md"
            size="sm"
          />
        </div>
        <div className={styles.filterItem}>
          <Text className={styles.filterLabel}>&nbsp;</Text>
          <Group gap="xs">
            <Button
              leftSection={<IconSearch size={14} />}
              radius="md"
              size="sm"
              color="vibOrange"
              onClick={handleSearch}
              loading={isFetching}
            >
              Tìm kiếm
            </Button>
            {hasFilter && (
              <Button variant="subtle" color="gray" size="sm" radius="md" onClick={handleReset}>
                Xóa lọc
              </Button>
            )}
          </Group>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={allUsers}
        keyField="id"
        loading={isFetching}
        emptyText="Không tìm thấy người dùng nào"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        footer={
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              Hiển thị {allUsers.length} / {totalElements} người dùng
            </Text>
            <Group gap="sm" align="center">
              {hasFilter && (
                <Button variant="subtle" color="gray" size="xs" radius="md" onClick={handleReset}>
                  Xóa bộ lọc
                </Button>
              )}
              {totalPages > 1 && (
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={totalPages}
                  size="sm"
                  radius="md"
                />
              )}
            </Group>
          </Group>
        }
      />
    </Stack>
  )
}
