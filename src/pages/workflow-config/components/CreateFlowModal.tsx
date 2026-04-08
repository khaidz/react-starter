import { useEffect } from 'react'
import { Button, Modal, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFlowsApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { CreateFlowPayload } from '@/types/workflow'

interface Props {
  opened: boolean
  onClose: () => void
}

export function CreateFlowModal({ opened, onClose }: Props) {
  const queryClient = useQueryClient()

  const form = useForm<CreateFlowPayload>({
    initialValues: { code: '', name: '' },
    validate: {
      code: (v) => (!v.trim() ? 'Bắt buộc' : /\s/.test(v) ? 'Không được chứa khoảng trắng' : null),
      name: (v) => (!v.trim() ? 'Bắt buộc' : null),
    },
  })

  useEffect(() => {
    if (!opened) form.reset()
  }, [opened])

  const { mutate, isPending } = useMutation({
    mutationFn: adminFlowsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flows'] })
      onClose()
    },
    onError: (error) => notifyError(error, 'Tạo Flow thất bại'),
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Tạo Flow mới" radius="md" size="sm">
      <form onSubmit={form.onSubmit((v) => mutate(v))}>
        <Stack gap="sm">
          <TextInput
            label="Mã Flow (Code)"
            placeholder="VD: LEAVE_REQUEST"
            description="Chữ hoa, không dấu, dùng dấu gạch dưới"
            radius="md"
            {...form.getInputProps('code')}
          />
          <TextInput
            label="Tên Flow"
            placeholder="VD: Quy trình duyệt nghỉ phép"
            radius="md"
            {...form.getInputProps('name')}
          />
          <Button type="submit" loading={isPending} radius="md" color="vibOrange" mt="xs">
            Tạo Flow
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
