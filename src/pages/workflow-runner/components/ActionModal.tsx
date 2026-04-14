import { Button, Group, Modal, MultiSelect, Select, Stack, Text, Textarea } from '@mantine/core'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { workflowApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import { notifications } from '@mantine/notifications'
import type { ActionType } from '@/types/workflow'
import { FileUploader, type UploadedFile } from '@/components/file-uploader'
import { usersApi } from '@/api/users.api'

const SINGLE_USER_ACTIONS: ActionType[] = ['TRANSFER']
const MULTI_USER_ACTIONS: ActionType[] = ['SHARE', 'ADD_ASSIGNEE']

const USER_SELECT_LABEL: Partial<Record<ActionType, string>> = {
  TRANSFER: 'Transfer to user',
  SHARE: 'Share with users',
  ADD_ASSIGNEE: 'Add assignees',
}

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
  const [singleUser, setSingleUser] = useState<string | null>(null)
  const [multiUsers, setMultiUsers] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const isSingle = SINGLE_USER_ACTIONS.includes(actionType)
  const isMulti = MULTI_USER_ACTIONS.includes(actionType)
  const needsUser = isSingle || isMulti

  const { data: usersData } = useQuery({
    queryKey: ['users-select'],
    queryFn: () => usersApi.search({ size: 200 }),
    enabled: needsUser && opened,
  })

  const userOptions = (usersData?.content ?? []).map((u) => ({
    value: u.username,
    label: u.username,
  }))

  const submitMutation = useMutation({
    mutationFn: () =>
      workflowApi.submitAction({
        workflowInstanceId,
        stepInstanceId,
        actionType,
        comment: comment.trim() || undefined,
        transferToUserId: isSingle ? (singleUser ?? undefined) : undefined,
        sharedToUserIds: actionType === 'SHARE' ? multiUsers : undefined,
        addAssigneeUserIds: actionType === 'ADD_ASSIGNEE' ? multiUsers : undefined,
        fileKeys: uploadedFiles.length > 0 ? uploadedFiles.map((f) => f.fileKey) : undefined,
      }),
    onSuccess: () => {
      notifications.show({ message: `Action submitted: ${actionLabel}`, color: 'green' })
      handleClose()
      onSuccess()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    setComment('')
    setSingleUser(null)
    setMultiUsers([])
    setUploadedFiles([])
    onClose()
  }

  const canSubmit = !needsUser || (isSingle ? !!singleUser : multiUsers.length > 0)

  return (
    <Modal opened={opened} onClose={handleClose} title={`Confirm: ${actionLabel}`} size="sm">
      <Stack gap="sm">
        {isSingle && (
          <Select
            label={USER_SELECT_LABEL[actionType] ?? 'Select user'}
            placeholder="Search and select a user"
            data={userOptions}
            searchable
            clearable
            required
            value={singleUser}
            onChange={setSingleUser}
          />
        )}
        {isMulti && (
          <MultiSelect
            label={USER_SELECT_LABEL[actionType] ?? 'Select users'}
            placeholder="Search and select users"
            data={userOptions}
            searchable
            clearable
            required
            value={multiUsers}
            onChange={setMultiUsers}
          />
        )}
        <Textarea
          label="Comment (optional)"
          placeholder="Enter a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          autosize
          minRows={2}
          maxRows={5}
        />
        <div>
          <Text size="sm" fw={500} mb={4}>
            Attachments (optional)
          </Text>
          <FileUploader
            onChange={setUploadedFiles}
            referenceType="WORKFLOW"
          />
        </div>
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            loading={submitMutation.isPending}
            disabled={!canSubmit}
          >
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
