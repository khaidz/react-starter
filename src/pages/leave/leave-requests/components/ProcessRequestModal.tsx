import { leaveRequestsApi } from '@/api/leave-requests.api'
import { notifyError } from '@/lib/notify'
import type { LeaveRequestItem } from '@/types/api'
import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface Props {
  opened: boolean
  onClose: () => void
  item: LeaveRequestItem | null
  action: 'approve' | 'reject'
}

export function ProcessRequestModal({ opened, onClose, item, action }: Props) {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')

  const mutation = useMutation<unknown, Error, void>({
    mutationFn: () =>
      action === 'approve'
        ? leaveRequestsApi.approve(item!.id, comment || undefined)
        : leaveRequestsApi.reject(item!.id, comment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      notifications.show({
        message: action === 'approve' ? 'Request approved' : 'Request rejected',
        color: action === 'approve' ? 'green' : 'red',
      })
      setComment('')
      onClose()
    },
    onError: (e) => notifyError(e),
  })

  function handleClose() {
    setComment('')
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={action === 'approve' ? 'Approve Request' : 'Reject Request'}
      centered
      size="sm"
    >
      <Stack gap="sm">
        {item && (
          <Text size="sm" c="dimmed">
            {item.requesterUsername} · {item.startDate} → {item.endDate} ({item.totalDays} days)
          </Text>
        )}
        <Textarea
          label="Comment (optional)"
          placeholder="Add a comment..."
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>Cancel</Button>
          <Button
            color={action === 'approve' ? 'green' : 'red'}
            loading={mutation.isPending}
            onClick={() => mutation.mutate(undefined)}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
