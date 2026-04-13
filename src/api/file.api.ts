import { del, http } from '@/lib/http'
import type { ApiResponse } from '@/types/api'

export interface FileStorageDto {
  fileKey: string
  originalName: string
  contentType: string
  fileSize: number
  sizeReadable: string
  createdAt: string
}

export const fileApi = {
  upload: async (file: File, referenceType?: string, referenceId?: number): Promise<FileStorageDto> => {
    const form = new FormData()
    form.append('file', file)
    if (referenceType) form.append('referenceType', referenceType)
    if (referenceId != null) form.append('referenceId', String(referenceId))
    const res = await http.post<ApiResponse<FileStorageDto>>('/api/v1/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  uploadMultiple: async (files: File[], referenceType?: string, referenceId?: number): Promise<FileStorageDto[]> => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    if (referenceType) form.append('referenceType', referenceType)
    if (referenceId != null) form.append('referenceId', String(referenceId))
    const res = await http.post<ApiResponse<FileStorageDto[]>>('/api/v1/files/upload-multiple', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  download: async (fileKey: string, filename?: string): Promise<void> => {
    const res = await http.get(`/api/v1/files/${fileKey}`, { responseType: 'blob' })

    // Lấy filename từ Content-Disposition nếu không truyền vào
    let name = filename
    if (!name) {
      const disposition = res.headers['content-disposition'] ?? ''
      // Ưu tiên filename* (RFC 5987)
      const rfcMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
      if (rfcMatch) {
        name = decodeURIComponent(rfcMatch[1])
      } else {
        const plain = disposition.match(/filename="?([^";\n]+)"?/i)
        name = plain ? plain[1].trim() : fileKey
      }
    }

    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name ?? fileKey
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  previewUrl: (fileKey: string) =>
    `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/files/${fileKey}/preview`,

  delete: (fileKey: string) =>
    del<void>(`/api/v1/files/${fileKey}`),
}
