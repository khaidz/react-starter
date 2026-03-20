import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Modal,
  Select,
  TextInput,
} from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconEdit,
} from '@tabler/icons-react'
import { departmentsApi, rolesApi, usersApi } from '@/api/users.api'
import type { UpdateUserPayload } from '@/api/users.api'
import type { UserItem } from '@/types/api'
import styles from '../users.module.scss'

const STATUS_OPTIONS = [
  { value: 'ACTIVE',  label: 'Hoạt động' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'LOCKED',  label: 'Đã khoá'   },
  { value: 'DELETED', label: 'Đã xoá'    },
]

interface EditForm {
  roleIds: string[]; deptId: string; status: string
}

interface Props {
  user: UserItem | null
  onClose: () => void
}

export function EditUserModal({ user, onClose }: Props) {
  const queryClient = useQueryClient()

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.search,
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  })

  const [form, setForm] = useState<EditForm>({ roleIds: [], deptId: '', status: 'ACTIVE' })

  useEffect(() => {
    if (!user) return
    const matchedRoleIds = user.roles
      .map((name) => roles.find((r) => r.name === name)?.id)
      .filter((id): id is number => id !== undefined)
      .map(String)
    const matchedDeptId = departments.find((d) => d.code === user.deptCode)?.id
    setForm({
      roleIds: matchedRoleIds,
      deptId: matchedDeptId ? String(matchedDeptId) : '',
      status: user.status,
    })
  }, [user, roles, departments])

  const { mutate: updateUser, isPending, error } = useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.update(user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
  })

  function set(field: keyof EditForm, value: string | string[]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit() {
    updateUser({
      status: form.status as 'ACTIVE' | 'INACTIVE',
      roleIds: form.roleIds.map(Number),
      deptId: form.deptId ? Number(form.deptId) : undefined,
    })
  }

  const roleOptions = roles.map((r) => ({ value: String(r.id), label: r.name }))
  const deptOptions = departments.map((d) => ({ value: String(d.id), label: d.name }))

  return (
    <Modal
      opened={!!user}
      onClose={onClose}
      title={
        <div className={styles.modalTitle}>
          <div className={styles.modalTitleIcon}>
            <IconEdit size={18} color="#fff" />
          </div>
          <div>
            <div className={styles.modalTitleText}>Chỉnh sửa người dùng</div>
            <div className={styles.modalTitleSub}>{user?.username}</div>
          </div>
        </div>
      }
      size="md"
      radius="lg"
      padding="md"
      centered
    >
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="sm" radius="md">
          {(error as Error).message ?? 'Có lỗi xảy ra, vui lòng thử lại'}
        </Alert>
      )}

      <div className={styles.formBody}>
        <TextInput label="Tên đăng nhập" value={user?.username ?? ''} disabled radius="md" />
        <TextInput label="Email" value={user?.email ?? ''} disabled radius="md" />

        <div className={styles.formRow}>
          <Select
            label="Vai trò"
            placeholder="Chọn vai trò"
            data={roleOptions}
            value={form.roleIds[0] ?? null}
            onChange={(v) => set('roleIds', v ? [v] : [])}
            radius="md"
            required
          />
          <Select
            label="Phòng ban"
            placeholder="Chọn phòng ban"
            data={deptOptions}
            value={form.deptId || null}
            onChange={(v) => set('deptId', v ?? '')}
            radius="md"
            clearable
          />
        </div>

        <Select
          label="Trạng thái"
          data={STATUS_OPTIONS}
          value={form.status}
          onChange={(v) => set('status', v ?? 'ACTIVE')}
          radius="md"
          size="sm"
        />
      </div>

      <div className={styles.modalFooter}>
        <Button variant="subtle" color="gray" radius="md" onClick={onClose} disabled={isPending}>
          Hủy
        </Button>
        <Button
          leftSection={<IconEdit size={16} />}
          radius="md"
          color="vibOrange"
          onClick={handleSubmit}
          loading={isPending}
        >
          Lưu thay đổi
        </Button>
      </div>
    </Modal>
  )
}
