import { useEffect } from 'react'
import { Button, Divider, Modal, NumberInput, Select, Stack, Switch, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { notifyError } from '@/lib/notify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'
import type { FlowStep } from '@/types/workflow'

const STEP_TYPE_OPTIONS = [
  { value: 'START', label: 'Start' },
  { value: 'SEQUENTIAL', label: 'Sequential' },
  { value: 'PARALLEL', label: 'Parallel' },
  { value: 'SUB_FLOW', label: 'Sub-flow' },
  { value: 'FINISH', label: 'Finish' },
]

const COMPLETION_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'ANY', label: 'Any' },
  { value: 'PERCENT', label: 'Percent' },
]

const SLA_ACTION_OPTIONS = [
  { value: 'AUTO_APPROVE', label: 'Auto approve' },
  { value: 'AUTO_REJECT', label: 'Auto reject' },
  { value: 'ESCALATE', label: 'Escalate' },
]

interface Props {
  opened: boolean
  onClose: () => void
  flowId: number
  step?: FlowStep
}

type FormValues = {
  name: string
  stepOrder: number | string
  type: string
  completionCondition: string
  completionThreshold: number | string
  slaDuration: number | string
  slaAction: string
  subFlowCode: string
  allowPickup: boolean
}

export function StepModal({ opened, onClose, flowId, step }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!step

  const form = useForm<FormValues>({
    initialValues: {
      name: step?.name ?? '',
      stepOrder: step?.stepOrder ?? 0,
      type: step?.type ?? 'SEQUENTIAL',
      completionCondition: step?.completionCondition ?? 'ALL',
      completionThreshold: step?.completionThreshold ?? '',
      slaDuration: step?.slaDuration ?? '',
      slaAction: step?.slaAction ?? '',
      subFlowCode: step?.subFlowCode ?? '',
      allowPickup: step?.allowPickup ?? false,
    },
    validate: {
      name: (v) => (!v ? 'Required' : null),
      stepOrder: (v) => (v === '' || v === undefined ? 'Required' : null),
      type: (v) => (!v ? 'Required' : null),
      completionCondition: (v) => (!v ? 'Required' : null),
      completionThreshold: (v, values) =>
        values.completionCondition === 'PERCENT' && (!v || Number(v) < 1 || Number(v) > 100)
          ? 'Must be 1–100 when using PERCENT'
          : null,
      subFlowCode: (v, values) =>
        values.type === 'SUB_FLOW' && !v ? 'Required when type = SUB_FLOW' : null,
    },
  })

  const buildPayload = (v: FormValues) => ({
    name: v.name,
    stepOrder: Number(v.stepOrder),
    type: v.type as never,
    completionCondition: v.completionCondition as never,
    completionThreshold: v.completionCondition === 'PERCENT' ? Number(v.completionThreshold) : null,
    slaDuration: v.slaDuration !== '' ? Number(v.slaDuration) : null,
    slaAction: v.slaAction || null,
    subFlowCode: v.type === 'SUB_FLOW' ? v.subFlowCode || null : null,
    allowPickup: v.allowPickup,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-flows', flowId] })

  const addMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      adminFlowsApi.addStep(flowId, payload as never),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Step added', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      adminFlowsApi.updateStep(step!.id, payload as never),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Step updated', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const isPending = addMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (opened) {
      form.setValues({
        name: step?.name ?? '',
        stepOrder: step?.stepOrder ?? 0,
        type: step?.type ?? 'SEQUENTIAL',
        completionCondition: step?.completionCondition ?? 'ALL',
        completionThreshold: step?.completionThreshold ?? '',
        slaDuration: step?.slaDuration ?? '',
        slaAction: step?.slaAction ?? '',
        subFlowCode: step?.subFlowCode ?? '',
        allowPickup: step?.allowPickup ?? false,
      })
    }
  }, [opened])

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(v: FormValues) {
    const payload = buildPayload(v)
    if (isEdit) updateMutation.mutate(payload)
    else addMutation.mutate(payload)
  }

  const showThreshold = form.values.completionCondition === 'PERCENT'
  const showSubFlow = form.values.type === 'SUB_FLOW'
  const showSla = form.values.slaDuration !== '' && form.values.slaDuration !== null

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit Step' : 'New Step'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput label="Step name" placeholder="e.g. Document review" {...form.getInputProps('name')} />

          <NumberInput
            label="Order"
            placeholder="0"
            min={0}
            {...form.getInputProps('stepOrder')}
          />

          <Select
            label="Step type"
            data={STEP_TYPE_OPTIONS}
            {...form.getInputProps('type')}
          />

          {showSubFlow && (
            <TextInput
              label="Sub-flow code"
              placeholder="e.g. CREDIT_CHECK"
              {...form.getInputProps('subFlowCode')}
            />
          )}

          <Select
            label="Completion condition"
            data={COMPLETION_OPTIONS}
            {...form.getInputProps('completionCondition')}
          />

          {showThreshold && (
            <NumberInput
              label="Completion threshold (%)"
              placeholder="1–100"
              min={1}
              max={100}
              {...form.getInputProps('completionThreshold')}
            />
          )}

          <Divider label="SLA (optional)" labelPosition="left" />

          <NumberInput
            label="SLA duration (seconds)"
            placeholder="e.g. 86400 = 1 day"
            min={1}
            {...form.getInputProps('slaDuration')}
          />

          {showSla && (
            <Select
              label="SLA breach action"
              data={SLA_ACTION_OPTIONS}
              clearable
              {...form.getInputProps('slaAction')}
            />
          )}

          <Divider label="Advanced" labelPosition="left" />

          <Switch
            label="Allow pickup"
            description="Allow users to self-assign and pick up this task"
            {...form.getInputProps('allowPickup', { type: 'checkbox' })}
          />

          <Button type="submit" loading={isPending} mt="xs">
            {isEdit ? 'Save changes' : 'Add step'}
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
