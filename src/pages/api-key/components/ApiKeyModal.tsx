import { apiKeysApi, type CreateApiKeyPayload, type UpdateApiKeyPayload } from '@/api/api-keys.api'
import { permissionsApi } from '@/api/permissions.api'
import { notifyError } from '@/lib/notify'
import type { ApiKeyItem } from '@/types/api'
import { Button, Group, Modal, MultiSelect, Stack, TextInput, Textarea } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toLocalISOString } from './utils'

export interface ApiKeyModalProps {
  opened: boolean
  onClose: () => void
  editItem?: ApiKeyItem | null
  onCreated: (key: ApiKeyItem) => void
}

export function ApiKeyModal({ opened, onClose, editItem, onCreated }: ApiKeyModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!editItem

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions-all'],
    queryFn: () => permissionsApi.search(),
  })

  const permissionOptions = allPermissions.map((p) => ({ value: p.id, label: p.name }))

  const EXPIRE_PRESETS = [
    { label: '1 day',   days: 1 },
    { label: '3 days',  days: 3 },
    { label: '7 days',  days: 7 },
    { label: '30 days', days: 30 },
  ]

  function daysFromNow(days: number): Date {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d
  }

  const form = useForm<{ name: string; description: string; expiresAt: Date | null; permissionIds: string[] }>({
    initialValues: { name: '', description: '', expiresAt: null, permissionIds: [] },
    validate: {
      name: (v) => (!v?.trim() ? 'Name is required' : null),
    },
  })

  useEffect(() => {
    if (opened) {
      if (editItem) {
        form.setValues({
          name: editItem.name,
          description: editItem.description ?? '',
          expiresAt: editItem.expiresAt ? new Date(editItem.expiresAt) : null,
          permissionIds: editItem.allowedPermissions?.map((p) => p.id) ?? [],
        })
      } else {
        form.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editItem])

  const createMutation = useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => apiKeysApi.create(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      handleClose()
      onCreated(created)
    },
    onError: (error) => notifyError(error),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateApiKeyPayload) => apiKeysApi.update(editItem!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      notifications.show({ message: 'API key updated successfully', color: 'green' })
      handleClose()
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: typeof form.values) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      expiresAt: toLocalISOString(values.expiresAt),
      permissionIds: values.permissionIds.length > 0 ? values.permissionIds : undefined,
    }
    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit API Key' : 'Create API Key'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Name"
            placeholder="e.g. Mobile App Key"
            withAsterisk
            {...form.getInputProps('name')}
          />
          <Textarea
            label="Description"
            placeholder="What this key is used for..."
            rows={3}
            {...form.getInputProps('description')}
          />
          <MultiSelect
            label="Allowed Permissions"
            placeholder="Leave empty to allow all"
            data={permissionOptions}
            searchable
            clearable
            {...form.getInputProps('permissionIds')}
          />
          <Stack gap={6}>
            <Group gap={6}>
              {EXPIRE_PRESETS.map((p) => (
                <Button
                  key={p.days}
                  size="xs"
                  variant="default"
                  onClick={() => form.setFieldValue('expiresAt', daysFromNow(p.days))}
                >
                  +{p.label}
                </Button>
              ))}
            </Group>
            <DateTimePicker
              label="Expires At"
              placeholder="No expiration"
              clearable
              valueFormat="DD/MM/YYYY HH:mm"
              minDate={new Date()}
              {...form.getInputProps('expiresAt')}
            />
          </Stack>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
