import { Button, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { CreateActionPayload, CreateAssigneePayload } from '@/types/workflow'

const ASSIGNEE_TYPE_OPTIONS = [
  { value: 'ROLE',       label: 'Role' },
  { value: 'USER',       label: 'User' },
  { value: 'DEPT_OWNER', label: 'Dept Owner' },
]

const ACTION_TYPE_OPTIONS = [
  { value: 'START',    label: 'START' },
  { value: 'APPROVE',  label: 'APPROVE' },
  { value: 'REJECT',   label: 'REJECT' },
  { value: 'TRANSFER', label: 'TRANSFER' },
  { value: 'EDIT',     label: 'EDIT' },
  { value: 'SHARE',    label: 'SHARE' },
  { value: 'FINISH',   label: 'FINISH' },
]

/* ── Add Assignee ── */
interface AssigneeProps {
  stepId: number
  flowId: number
  onClose: () => void
}

export function AssigneeModal({ stepId, flowId, onClose }: AssigneeProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateAssigneePayload>({
    initialValues: { assigneeType: 'ROLE', assigneeValue: '' },
    validate: {
      assigneeValue: (v) => (!v.trim() ? 'Bắt buộc' : null),
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateAssigneePayload) => adminFlowsApi.addAssignee(stepId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flow-detail', flowId] })
      onClose()
    },
    onError: (error) => notifyError(error, 'Thêm Assignee thất bại'),
  })

  return (
    <Modal opened onClose={onClose} title="Thêm Assignee" radius="md" size="sm">
      <form onSubmit={form.onSubmit((v) => mutate(v))}>
        <Stack gap="sm">
          <Select
            label="Loại Assignee"
            data={ASSIGNEE_TYPE_OPTIONS}
            radius="md"
            {...form.getInputProps('assigneeType')}
          />
          <TextInput
            label="Giá trị"
            placeholder="VD: ROLE_MANAGER · username · (trống cho DEPT_OWNER)"
            radius="md"
            {...form.getInputProps('assigneeValue')}
          />
          <Button type="submit" loading={isPending} radius="md" color="vibOrange" mt="xs">
            Thêm
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

/* ── Add Action Template ── */
interface ActionProps {
  stepId: number
  flowId: number
  onClose: () => void
}

export function ActionModal({ stepId, flowId, onClose }: ActionProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateActionPayload>({
    initialValues: { actionType: 'APPROVE', name: 'Phê duyệt' },
    validate: {
      name: (v) => (!v.trim() ? 'Bắt buộc' : null),
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateActionPayload) => adminFlowsApi.addAction(stepId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flow-detail', flowId] })
      onClose()
    },
    onError: (error) => notifyError(error, 'Thêm Action thất bại'),
  })

  return (
    <Modal opened onClose={onClose} title="Thêm Action Template" radius="md" size="sm">
      <form onSubmit={form.onSubmit((v) => mutate(v))}>
        <Stack gap="sm">
          <Select
            label="Loại Action"
            data={ACTION_TYPE_OPTIONS}
            radius="md"
            {...form.getInputProps('actionType')}
            onChange={(v) => {
              if (!v) return
              form.setFieldValue('actionType', v as CreateActionPayload['actionType'])
              // Gợi ý tên mặc định theo action type
              const defaults: Record<string, string> = {
                APPROVE: 'Phê duyệt', REJECT: 'Từ chối',
                TRANSFER: 'Chuyển tiếp', EDIT: 'Chỉnh sửa',
                SHARE: 'Chia sẻ', START: 'Bắt đầu', FINISH: 'Hoàn thành',
              }
              form.setFieldValue('name', defaults[v] ?? v)
            }}
          />
          <TextInput label="Tên hiển thị" radius="md" {...form.getInputProps('name')} />
          <Button type="submit" loading={isPending} radius="md" color="vibOrange" mt="xs">
            Thêm
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
