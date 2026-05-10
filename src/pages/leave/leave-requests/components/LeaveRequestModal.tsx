import { leaveRequestsApi, type CreateLeaveRequestPayload } from '@/api/leave-requests.api'
import { leaveTypesApi } from '@/api/leave-types.api'
import { notifyError } from '@/lib/notify'
import { Button, Group, Modal, Select, Stack, Textarea } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

interface Props {
  opened: boolean
  onClose: () => void
}

export function LeaveRequestModal({ opened, onClose }: Props) {
  const queryClient = useQueryClient()

  const form = useForm<{ leaveTypeId: string; dates: [Date | null, Date | null]; reason: string }>({
    initialValues: { leaveTypeId: '', dates: [null, null], reason: '' },
    validate: {
      leaveTypeId: (v) => (!v ? 'Leave type is required' : null),
      dates: (v) => (!v[0] || !v[1] ? 'Please select date range' : null),
    },
  })

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types', 'active'],
    queryFn: () => leaveTypesApi.listActive(),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (opened) form.reset()
  }, [opened])

  const createMutation = useMutation({
    mutationFn: (payload: CreateLeaveRequestPayload) => leaveRequestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      notifications.show({ message: 'Leave request submitted', color: 'green' })
      onClose()
    },
    onError: (e) => notifyError(e),
  })

  function handleSubmit(values: typeof form.values) {
    if (!values.dates[0] || !values.dates[1]) return
    const toISO = (d: Date) => d.toISOString().split('T')[0]
    createMutation.mutate({
      leaveTypeId: values.leaveTypeId,
      startDate: toISO(values.dates[0]),
      endDate: toISO(values.dates[1]),
      reason: values.reason || undefined,
    })
  }

  const typeOptions = (leaveTypes ?? []).map((t) => ({ value: t.id, label: t.name }))

  return (
    <Modal opened={opened} onClose={onClose} title="New Leave Request" centered size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Select
            label="Leave Type"
            placeholder="Select type..."
            data={typeOptions}
            {...form.getInputProps('leaveTypeId')}
          />
          <DatePickerInput
            type="range"
            label="Date Range"
            placeholder="Pick date range"
            minDate={new Date()}
            {...form.getInputProps('dates')}
          />
          <Textarea label="Reason (optional)" placeholder="Reason..." rows={3} {...form.getInputProps('reason')} />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Submit</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
