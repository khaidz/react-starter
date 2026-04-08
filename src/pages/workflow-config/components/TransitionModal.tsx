import { useEffect } from 'react'
import { Button, Checkbox, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { ActionType, CreateTransitionPayload, FlowStep, Transition } from '@/types/workflow'

const ACTION_TYPE_OPTIONS = [
  { value: 'START',    label: 'START' },
  { value: 'APPROVE',  label: 'APPROVE' },
  { value: 'REJECT',   label: 'REJECT' },
  { value: 'TRANSFER', label: 'TRANSFER' },
  { value: 'EDIT',     label: 'EDIT' },
  { value: 'SHARE',    label: 'SHARE' },
  { value: 'FINISH',   label: 'FINISH' },
]

interface Props {
  flowId: number
  steps: FlowStep[]
  transition?: Transition | null
  defaultFromStepId?: number
  onClose: () => void
}

export function TransitionModal({ flowId, steps, transition, defaultFromStepId, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!transition

  const toStepOptions = [
    { value: '__END__', label: '— Kết thúc flow —' },
    ...steps.map((s) => ({ value: String(s.id), label: `Step ${s.stepOrder}: ${s.name}` })),
  ]

  const form = useForm<{
    fromStepId: string
    toStepId: string
    actionType: string
    conditionExpression: string
    priority: string
    isDefault: boolean
  }>({
    initialValues: {
      fromStepId: defaultFromStepId ? String(defaultFromStepId) : '',
      toStepId: '__END__',
      actionType: 'APPROVE',
      conditionExpression: '',
      priority: '0',
      isDefault: true,
    },
    validate: {
      fromStepId: (v) => (!v ? 'Bắt buộc' : null),
    },
  })

  useEffect(() => {
    if (transition) {
      form.setValues({
        fromStepId: transition.fromStepId ? String(transition.fromStepId) : '',
        toStepId: transition.toStepId ? String(transition.toStepId) : '__END__',
        actionType: transition.actionType,
        conditionExpression: transition.conditionExpression ?? '',
        priority: String(transition.priority),
        isDefault: transition.isDefault,
      })
    }
  }, [transition])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: typeof form.values) => {
      const payload: CreateTransitionPayload = {
        fromStepId: Number(values.fromStepId),
        toStepId: values.toStepId === '__END__' ? null : Number(values.toStepId),
        actionType: values.actionType as ActionType,
        conditionExpression: values.conditionExpression.trim() || null,
        priority: Number(values.priority) || 0,
        isDefault: values.isDefault,
      }
      return isEdit
        ? adminFlowsApi.updateTransition(transition!.id, payload)
        : adminFlowsApi.addTransition(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flow-detail', flowId] })
      onClose()
    },
    onError: (error) => notifyError(error, isEdit ? 'Cập nhật Transition thất bại' : 'Thêm Transition thất bại'),
  })

  return (
    <Modal
      opened
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa Transition' : 'Thêm Transition'}
      radius="md"
      size="md"
    >
      <form onSubmit={form.onSubmit((v) => mutate(v))}>
        <Stack gap="sm">
          <Select
            label="Từ Step"
            data={steps.map((s) => ({ value: String(s.id), label: `Step ${s.stepOrder}: ${s.name}` }))}
            radius="md"
            placeholder="Chọn step nguồn..."
            {...form.getInputProps('fromStepId')}
          />

          <Select
            label="Đến Step"
            data={toStepOptions}
            radius="md"
            description="Chọn '— Kết thúc flow —' nếu đây là bước cuối"
            {...form.getInputProps('toStepId')}
          />

          <Select
            label="Khi Action"
            data={ACTION_TYPE_OPTIONS}
            radius="md"
            {...form.getInputProps('actionType')}
          />

          <TextInput
            label="Điều kiện (SpEL expression)"
            placeholder="VD: #ctx['amount'] > 1000"
            description="Để trống nếu không có điều kiện"
            radius="md"
            {...form.getInputProps('conditionExpression')}
          />

          <TextInput
            label="Priority"
            type="number"
            description="Ưu tiên cao hơn = số nhỏ hơn"
            radius="md"
            {...form.getInputProps('priority')}
          />

          <Checkbox
            label="Là transition mặc định (isDefault)"
            {...form.getInputProps('isDefault', { type: 'checkbox' })}
          />

          <Button type="submit" loading={isPending} radius="md" color="vibOrange" mt="xs">
            {isEdit ? 'Lưu thay đổi' : 'Thêm Transition'}
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
