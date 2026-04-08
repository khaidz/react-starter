import { useEffect } from 'react'
import { Button, Modal, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { CreateStepPayload, FlowStep } from '@/types/workflow'

const STEP_TYPE_OPTIONS = [
  { value: 'START',       label: 'START – bước khởi đầu (auto)' },
  { value: 'SEQUENTIAL',  label: 'SEQUENTIAL – tuần tự' },
  { value: 'PARALLEL',    label: 'PARALLEL – song song' },
  { value: 'FINISH',      label: 'FINISH – bước kết thúc (auto)' },
]

const COMPLETION_OPTIONS = [
  { value: 'ALL',     label: 'ALL – tất cả phê duyệt' },
  { value: 'ANY',     label: 'ANY – một người phê duyệt' },
  { value: 'PERCENT', label: 'PERCENT – theo tỉ lệ %' },
]

const SLA_ACTION_OPTIONS = [
  { value: 'AUTO_APPROVE', label: 'Auto Approve' },
  { value: 'AUTO_REJECT',  label: 'Auto Reject' },
  { value: 'ESCALATE',     label: 'Escalate' },
]

interface Props {
  flowId: number
  step?: FlowStep | null
  nextOrder: number
  onClose: () => void
}

export function StepModal({ flowId, step, nextOrder, onClose }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!step

  const form = useForm<CreateStepPayload>({
    initialValues: {
      name: '',
      stepOrder: nextOrder,
      type: 'SEQUENTIAL',
      completionCondition: 'ALL',
      completionThreshold: null,
      slaDuration: 86400,
      slaAction: 'AUTO_REJECT',
    },
    validate: {
      name: (v) => (!v.trim() ? 'Bắt buộc' : null),
      stepOrder: (v) => (v < 0 ? 'Phải >= 0' : null),
      completionThreshold: (v, values) =>
        values.completionCondition === 'PERCENT' && !v ? 'Bắt buộc khi chọn PERCENT' : null,
    },
  })

  useEffect(() => {
    if (step) {
      form.setValues({
        name: step.name,
        stepOrder: step.stepOrder,
        type: step.type,
        completionCondition: step.completionCondition,
        completionThreshold: step.completionThreshold,
        slaDuration: step.slaDuration,
        slaAction: step.slaAction,
      })
    } else {
      form.reset()
      form.setFieldValue('stepOrder', nextOrder)
    }
  }, [step, nextOrder])

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateStepPayload) =>
      isEdit
        ? adminFlowsApi.updateStep(step!.id, payload)
        : adminFlowsApi.addStep(flowId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flow-detail', flowId] })
      onClose()
    },
    onError: (error) => notifyError(error, isEdit ? 'Cập nhật Step thất bại' : 'Thêm Step thất bại'),
  })

  const showSlaFields = form.values.type !== 'START' && form.values.type !== 'FINISH'

  return (
    <Modal
      opened
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa Step' : 'Thêm Step mới'}
      radius="md"
      size="md"
    >
      <form onSubmit={form.onSubmit((v) => mutate(v))}>
        <Stack gap="sm">
          <TextInput label="Tên Step" placeholder="VD: Manager Approval" radius="md" {...form.getInputProps('name')} />

          <NumberInput label="Thứ tự (Order)" min={0} radius="md" {...form.getInputProps('stepOrder')} />

          <Select label="Kiểu Step" data={STEP_TYPE_OPTIONS} radius="md" {...form.getInputProps('type')} />

          {showSlaFields && (
            <>
              <Select
                label="Điều kiện hoàn thành"
                data={COMPLETION_OPTIONS}
                radius="md"
                {...form.getInputProps('completionCondition')}
              />

              {form.values.completionCondition === 'PERCENT' && (
                <NumberInput
                  label="Ngưỡng % (1–100)"
                  min={1}
                  max={100}
                  radius="md"
                  {...form.getInputProps('completionThreshold')}
                />
              )}

              <NumberInput
                label="SLA Duration (giây)"
                description="86400 = 1 ngày · để trống = không có SLA"
                min={1}
                radius="md"
                {...form.getInputProps('slaDuration')}
              />

              <Select
                label="Hành động khi quá SLA"
                data={SLA_ACTION_OPTIONS}
                radius="md"
                clearable
                {...form.getInputProps('slaAction')}
              />
            </>
          )}

          <Button type="submit" loading={isPending} radius="md" color="vibOrange" mt="xs">
            {isEdit ? 'Lưu thay đổi' : 'Thêm Step'}
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
