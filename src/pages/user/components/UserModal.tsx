import { usersApi, type CreateUserPayload, type UpdateUserPayload } from '@/api/users.api'
import { departmentsApi } from '@/api/departments.api'
import { rolesApi } from '@/api/roles.api'
import { notifyError } from '@/lib/notify'
import type { UserItem, UserStatus } from '@/types/api'
import {
  Button,
  Checkbox,
  Group,
  Modal,
  MultiSelect,
  PasswordInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'LOCKED', label: 'Locked' },
  { value: 'DELETED', label: 'Deleted' },
]

export interface UserModalProps {
  opened: boolean
  onClose: () => void
  editItem?: UserItem | null
}

export function UserModal({ opened, onClose, editItem }: UserModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const { data: allRoles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
    staleTime: 60_000,
  })

  const { data: allDepts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.search(),
    staleTime: 60_000,
  })

  const roleOptions = allRoles.map((r) => ({ value: String(r.id), label: r.name }))
  const deptOptions = allDepts.map((d) => ({
    value: String(d.id),
    label: d.name,
  }))

  const form = useForm<{
    username: string
    password: string
    email: string
    status: UserStatus
    roleIds: string[]
    deptId: string | null
    isDepartmentOwner: boolean
  }>({
    initialValues: {
      username: '',
      password: '',
      email: '',
      status: 'ACTIVE',
      roleIds: [],
      deptId: null,
      isDepartmentOwner: false,
    },
    validate: {
      username: (v) => (!v?.trim() ? 'Username is required' : null),
      password: (v, _values) => (!isEdit && !v?.trim() ? 'Password is required' : null),
      email: (v) => {
        if (!v?.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Invalid email'
        return null
      },
      roleIds: (v) => (!v?.length ? 'At least one role is required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({
          username: editItem.username,
          password: '',
          email: editItem.email,
          status: editItem.status,
          roleIds: [],
          deptId: null,
          isDepartmentOwner: editItem.isDepartmentOwner ?? false,
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem])

  useEffect(() => {
    if (opened && editItem) {
      usersApi.getById(editItem.id).then((detail) => {
        const matchedRoleIds = allRoles
          .filter((r) => detail.roles?.includes(r.name))
          .map((r) => String(r.id))
        const matchedDept = allDepts.find((d) => d.code === detail.deptCode)
        form.setValues((prev) => ({
          ...prev,
          roleIds: matchedRoleIds,
          deptId: matchedDept ? String(matchedDept.id) : null,
        }))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem, allRoles, allDepts])

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notifications.show({ message: 'User created successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      notifications.show({ message: 'User updated successfully', color: 'green' })
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
      username: values.username,
      email: values.email,
      status: values.status,
      roleIds: values.roleIds,
      deptId: values.deptId ?? null,
      isDepartmentOwner: values.isDepartmentOwner,
    }
    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate({ ...payload, password: values.password })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit User' : 'Add User'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Username"
            placeholder="e.g. john.doe"
            withAsterisk
            {...form.getInputProps('username')}
          />
          {!isEdit && (
            <PasswordInput
              label="Password"
              placeholder="Min 6 characters"
              withAsterisk
              {...form.getInputProps('password')}
            />
          )}
          <TextInput
            label="Email"
            placeholder="e.g. john@example.com"
            withAsterisk
            {...form.getInputProps('email')}
          />
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            {...form.getInputProps('status')}
          />
          <MultiSelect
            label="Roles"
            placeholder="Select roles..."
            data={roleOptions}
            searchable
            withAsterisk
            {...form.getInputProps('roleIds')}
          />
          <Select
            label="Department"
            placeholder="— No department —"
            data={deptOptions}
            searchable
            clearable
            {...form.getInputProps('deptId')}
          />
          <Checkbox
            label="Department Owner"
            {...form.getInputProps('isDepartmentOwner', { type: 'checkbox' })}
          />
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
