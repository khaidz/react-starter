import { Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { workflowApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import { notifications } from '@mantine/notifications'
import type { ActionType } from '@/types/workflow'

interface Props {
  workflowInstanceId: number
  stepInstanceId: number
  actionType: ActionType
  actionLabel: string
  opened: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ActionModal({
  workflowInstanceId,
  stepInstanceId,
  actionType,
  actionLabel,
  opened,
  onClose,
  onSuccess,
}: Props) {
  const [comment, setComment] = useState('')
  const [transferToUserId, setTransferToUserId] = useState('')

  const submitMutation = useMutation({
    mutationFn: () =>
      workflowApi.submitAction({
        workflowInstanceId,
        stepInstanceId,
        actionType,
        comment: comment.trim() || undefined,
        transferToUserId: actionType === 'TRANSFER' ? transferToUserId.trim() : undefined,
      }),
    onSuccess: () => {
      notifications.show({ message: `Đã thực hiện: ${actionLabel}`, color: 'green' })
      handleClose()
      onSuccess()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    setComment('')
    setTransferToUserId('')
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={`Xác nhận: ${actionLabel}`} size="sm">
      <Stack gap="sm">
        {actionType === 'TRANSFER' && (
          <TextInput
            label="Chuyển cho User ID"
            placeholder="Nhập userId người nhận"
            value={transferToUserId}
            onChange={(e) => setTransferToUserId(e.target.value)}
            required
          />
        )}
        <Textarea
          label="Ghi chú (tuỳ chọn)"
          placeholder="Nhập ghi chú..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          autosize
          minRows={2}
          maxRows={5}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            loading={submitMutation.isPending}
            disabled={actionType === 'TRANSFER' && !transferToUserId.trim()}
          >
            Xác nhận
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
