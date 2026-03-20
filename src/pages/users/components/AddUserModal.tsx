import { useState } from 'react'
import {
  Alert,
  Button,
  Modal,
  PasswordInput,
  Select,
  TextInput,
} from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconUserPlus,
} from '@tabler/icons-react'
import { departmentsApi, rolesApi, usersApi } from '@/api/users.api'
import type { CreateUserPayload } from '@/api/users.api'
import type { UserStatus } from '@/types/api'
import styles from '../users.module.scss'

const STATUS_OPTIONS = [
  { value: 'ACTIVE',  label: 'Hoạt động' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'LOCKED',  label: 'Đã khoá'   },
  { value: 'DELETED', label: 'Đã xoá'    },
]

interface UserForm {
  username: string; email: string; password: string
  roleIds: string[]; deptId: string; status: string
}
const EMPTY_FORM: UserForm = { username: '', email: '', password: '', roleIds: [], deptId: '', status: 'ACTIVE' }

interface Props {
  opened: boolean
  onClose: () => void
}

export function AddUserModal({ opened, onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof UserForm, string>>>({})

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.search,
    staleTime: 5 * 60 * 1000,
    enabled: opened,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    staleTime: 5 * 60 * 1000,
    enabled: opened,
  })

  const { mutate: createUser, isPending, error } = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      handleClose()
    },
  })

  function set(field: keyof UserForm, value: string | string[]) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof UserForm, string>> = {}
    if (!form.username.trim())    errs.username = 'Vui lòng nhập tên đăng nhập'
    if (!form.email.trim())       errs.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ'
    if (!form.password.trim())    errs.password = 'Vui lòng nhập mật khẩu'
    else if (form.password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự'
    if (form.roleIds.length === 0) errs.roleIds = 'Vui lòng chọn ít nhất một vai trò'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    createUser({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      status: form.status as UserStatus,
      roleIds: form.roleIds.map(Number),
      deptId: form.deptId ? Number(form.deptId) : undefined,
    })
  }

  function handleClose() {
    setForm(EMPTY_FORM)
    setErrors({})
    onClose()
  }

  const roleOptions = roles.map((r) => ({ value: String(r.id), label: r.name }))
  const deptOptions = departments.map((d) => ({ value: String(d.id), label: d.name }))

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <div className={styles.modalTitle}>
          <div className={styles.modalTitleIcon}>
            <IconUserPlus size={18} color="#fff" />
          </div>
          <div>
            <div className={styles.modalTitleText}>Thêm người dùng mới</div>
            <div className={styles.modalTitleSub}>Điền đầy đủ thông tin bên dưới</div>
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
        <TextInput
          label="Tên đăng nhập"
          placeholder="username"
          value={form.username}
          onChange={(e) => set('username', e.currentTarget.value)}
          error={errors.username}
          radius="md"
          required
        />
        <TextInput
          label="Email"
          placeholder="example@vib.com.vn"
          value={form.email}
          onChange={(e) => set('email', e.currentTarget.value)}
          error={errors.email}
          radius="md"
          required
        />
        <PasswordInput
          label="Mật khẩu"
          placeholder="Tối thiểu 6 ký tự"
          value={form.password}
          onChange={(e) => set('password', e.currentTarget.value)}
          error={errors.password}
          radius="md"
          required
        />
        <div className={styles.formRow}>
          <Select
            label="Vai trò"
            placeholder="Chọn vai trò"
            data={roleOptions}
            value={form.roleIds[0] ?? null}
            onChange={(v) => set('roleIds', v ? [v] : [])}
            error={errors.roleIds}
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
        />
      </div>

      <div className={styles.modalFooter}>
        <Button variant="subtle" color="gray" radius="md" onClick={handleClose} disabled={isPending}>
          Hủy
        </Button>
        <Button
          leftSection={<IconUserPlus size={16} />}
          radius="md"
          color="vibOrange"
          onClick={handleSubmit}
          loading={isPending}
        >
          Thêm người dùng
        </Button>
      </div>
    </Modal>
  )
}
