import { notifications } from '@mantine/notifications'

type ApiError = Error & { response?: { data?: { message?: string } } }

export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi, vui lòng thử lại'): string {
  const e = error as ApiError
  return e?.response?.data?.message ?? e?.message ?? fallback
}

export function notifyError(error: unknown, title = 'Lỗi') {
  notifications.show({
    title,
    message: getApiErrorMessage(error),
    color: 'red',
  })
}

export function notifySuccess(message: string, title = 'Thành công') {
  notifications.show({
    title,
    message,
    color: 'green',
  })
}
