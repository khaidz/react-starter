import { useEffect } from 'react'
import { Button, Checkbox, Modal, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { notifyError } from '@/lib/notify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'
import type { FlowStep, Transition } from '@/types/workflow'
import { ACTION_TYPE_OPTIONS } from './ActionModal'

interface Props {
  opened: boolean
  onClose: () => void
  flowId: number
  steps: FlowStep[]
  transition?: Transition
  defaultFromStepId?: number
}

type FormValues = {
  fromStepId: string
  toStepId: string
  actionType: string
  conditionExpression: string
  priority: number | string
  isDefault: boolean
}

export function TransitionModal({
  opened,
  onClose,
  flowId,
  steps,
  transition,
  defaultFromStepId,
}: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!transition

  const stepOptions = steps.map((s) => ({
    value: String(s.id),
    label: `${s.stepOrder}. ${s.name} (${s.type})`,
  }))

  const toStepOptions = [
    { value: '', label: '— End (terminal) —' },
    ...stepOptions,
  ]

  const form = useForm<FormValues>({
    initialValues: {
      fromStepId: transition ? String(transition.fromStepId) : defaultFromStepId ? String(defaultFromStepId) : '',
      toStepId: transition?.toStepId != null ? String(transition.toStepId) : '',
      actionType: transition?.actionType ?? '',
      conditionExpression: transition?.conditionExpression ?? '',
      priority: transition?.priority ?? 1,
      isDefault: transition?.isDefault ?? false,
    },
    validate: {
      fromStepId: (v) => (!v ? 'Required' : null),
      actionType: (v) => (!v ? 'Required' : null),
      priority: (v) => (v === '' || v === undefined ? 'Required' : null),
    },
  })

  const buildPayload = (v: FormValues) => ({
    fromStepId: Number(v.fromStepId),
    toStepId: v.toStepId ? Number(v.toStepId) : null,
    actionType: v.actionType as never,
    conditionExpression: v.conditionExpression || null,
    priority: Number(v.priority),
    isDefault: v.isDefault,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-flows', flowId] })

  const addMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) => adminFlowsApi.addTransition(payload),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Transition added', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      adminFlowsApi.updateTransition(transition!.id, payload),
    onSuccess: () => {
      invalidate()
      notifications.show({ message: 'Transition updated', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  const isPending = addMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (opened) {
      form.setValues({
        fromStepId: transition ? String(transition.fromStepId) : defaultFromStepId ? String(defaultFromStepId) : '',
        toStepId: transition?.toStepId != null ? String(transition.toStepId) : '',
        actionType: transition?.actionType ?? '',
        conditionExpression: transition?.conditionExpression ?? '',
        priority: transition?.priority ?? 1,
        isDefault: transition?.isDefault ?? false,
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

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit Transition' : 'New Transition'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Select
            label="From step"
            data={stepOptions}
            placeholder="Select source step"
            {...form.getInputProps('fromStepId')}
          />
          <Select
            label="To step"
            data={toStepOptions}
            placeholder="Select target step (empty = terminal)"
            {...form.getInputProps('toStepId')}
          />
          <Select
            label="Trigger action"
            data={ACTION_TYPE_OPTIONS}
            placeholder="Select action"
            {...form.getInputProps('actionType')}
          />
          <TextInput
            label="Condition (SpEL, optional)"
            placeholder="e.g. #amount > 100000000"
            {...form.getInputProps('conditionExpression')}
          />
          <NumberInput
            label="Priority"
            min={0}
            {...form.getInputProps('priority')}
          />
          <Checkbox
            label="Default transition"
            {...form.getInputProps('isDefault', { type: 'checkbox' })}
          />
          <Button type="submit" loading={isPending} mt="xs">
            {isEdit ? 'Save changes' : 'Add transition'}
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
