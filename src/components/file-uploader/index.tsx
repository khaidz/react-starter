import { useRef, useState } from 'react'
import { ActionIcon, Group, Loader, Progress, Stack, Text, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { Dropzone } from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import { IconPaperclip, IconUpload, IconX } from '@tabler/icons-react'
import { fileApi, type FileStorageDto } from '@/api/file.api'
import { notifyError } from '@/lib/notify'

export interface UploadedFile {
  fileKey: string
  originalName: string
  sizeReadable: string
  contentType: string
}

interface Props {
  /** Called whenever the list of successfully uploaded files changes */
  onChange: (files: UploadedFile[]) => void
  /** Max file size in bytes (default 20 MB) */
  maxSize?: number
  /** Accept mime types, e.g. ['image/*', 'application/pdf'] — undefined = all */
  accept?: string[]
  disabled?: boolean
  referenceType?: string
  referenceId?: number
}

interface UploadItem {
  id: string
  name: string
  size: number
  /** undefined = uploading, 0-100 */
  progress: number | undefined
  /** Set when upload finished */
  dto: FileStorageDto | undefined
  error: string | undefined
  deleting: boolean
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUploader({
  onChange,
  maxSize = 20 * 1024 * 1024,
  accept,
  disabled,
  referenceType,
  referenceId,
}: Props) {
  const [items, setItems] = useState<UploadItem[]>([])
  const openRef = useRef<() => void>(null)

  function notifyChange(updated: UploadItem[]) {
    const uploaded: UploadedFile[] = updated
      .filter((it) => it.dto)
      .map((it) => ({
        fileKey: it.dto!.fileKey,
        originalName: it.dto!.originalName,
        sizeReadable: it.dto!.sizeReadable,
        contentType: it.dto!.contentType,
      }))
    onChange(uploaded)
  }

  async function handleDrop(files: File[]) {
    const newItems: UploadItem[] = files.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      progress: undefined,
      dto: undefined,
      error: undefined,
      deleting: false,
    }))

    setItems((prev) => {
      const next = [...prev, ...newItems]
      notifyChange(next)
      return next
    })

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const id = newItems[i].id

      try {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress: 10 } : it)))

        const dto = await fileApi.upload(file, referenceType, referenceId)

        setItems((prev) => {
          const next = prev.map((it) => (it.id === id ? { ...it, progress: 100, dto } : it))
          notifyChange(next)
          return next
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, progress: 100, error: message } : it)),
        )
        notifications.show({ message: `Failed to upload ${file.name}: ${message}`, color: 'red' })
      }
    }
  }

  function confirmRemove(item: UploadItem) {
    // Chưa upload xong hoặc lỗi → xóa khỏi list, không cần gọi API
    if (!item.dto) {
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== item.id)
        notifyChange(next)
        return next
      })
      return
    }

    modals.openConfirmModal({
      title: 'Xóa file',
      children: (
        <Text size="sm">
          Bạn có chắc muốn xóa <strong>{item.name}</strong>?
        </Text>
      ),
      labels: { confirm: 'Xóa', cancel: 'Hủy' },
      confirmProps: { color: 'red' },
      onConfirm: () => doDelete(item),
    })
  }

  async function doDelete(item: UploadItem) {
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, deleting: true } : it)),
    )
    try {
      await fileApi.delete(item.dto!.fileKey)
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== item.id)
        notifyChange(next)
        return next
      })
    } catch (err) {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, deleting: false } : it)),
      )
      notifyError(err)
    }
  }

  const uploading = items.some((it) => it.progress === undefined || it.progress < 100)

  return (
    <Stack gap={6}>
      <Dropzone
        openRef={openRef}
        onDrop={handleDrop}
        onReject={(rejected) => {
          rejected.forEach((r) => {
            const msgs = r.errors.map((e) => e.message).join(', ')
            notifications.show({ message: `${r.file.name}: ${msgs}`, color: 'red' })
          })
        }}
        maxSize={maxSize}
        accept={accept}
        disabled={disabled || uploading}
        styles={{ root: { padding: '8px 12px', minHeight: 'unset' } }}
      >
        <Group gap={8} align="center" style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload size={16} color="var(--mantine-color-blue-6)" />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={16} color="var(--mantine-color-red-6)" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPaperclip size={16} color="var(--mantine-color-dimmed)" />
          </Dropzone.Idle>
          <Text size="xs" c="dimmed">
            Kéo thả file vào đây hoặc{' '}
            <Text
              span
              c="blue"
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
              onClick={(e) => {
                e.stopPropagation()
                openRef.current?.()
              }}
            >
              chọn file
            </Text>
            {maxSize && ` — tối đa ${humanSize(maxSize)}`}
          </Text>
          {uploading && <Loader size={12} />}
        </Group>
      </Dropzone>

      {items.length > 0 && (
        <Stack gap={4}>
          {items.map((it) => (
            <div key={it.id}>
              <Group gap={6} align="center" wrap="nowrap">
                <IconPaperclip
                  size={12}
                  style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }}
                />
                <Text
                  size="xs"
                  style={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }}
                  c={it.error ? 'red' : undefined}
                >
                  {it.name}
                </Text>
                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                  {humanSize(it.size)}
                </Text>
                {it.progress !== undefined && it.progress < 100 && (
                  <Loader size={10} style={{ flexShrink: 0 }} />
                )}
                {it.deleting ? (
                  <Loader size={10} color="red" style={{ flexShrink: 0 }} />
                ) : (
                  <Tooltip label="Xóa file" withArrow>
                    <ActionIcon
                      size="xs"
                      color="red"
                      variant="subtle"
                      disabled={it.progress !== undefined && it.progress < 100}
                      onClick={() => confirmRemove(it)}
                    >
                      <IconX size={11} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
              {it.progress !== undefined && it.progress < 100 && (
                <Progress value={it.progress} size={2} mt={2} />
              )}
              {it.error && (
                <Text size="xs" c="red" ml={18}>
                  {it.error}
                </Text>
              )}
            </div>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
