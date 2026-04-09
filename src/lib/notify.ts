import { notifications } from '@mantine/notifications'

type ApiError = Error & { response?: { data?: { message?: string } } }

export function getApiErrorMessage(error: unknown, fallback = 'An error occurred, please try again'): string {
  const e = error as ApiError
  return e?.response?.data?.message ?? e?.message ?? fallback
}

export function notifyError(error: unknown, title = 'Error') {
  notifications.show({
    title,
    message: getApiErrorMessage(error),
    color: 'red',
  })
}

export function notifySuccess(message: string, title = 'Success') {
  notifications.show({
    title,
    message,
    color: 'green',
  })
}
