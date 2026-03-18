import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth.store'
import type { ApiResponse, RefreshData } from '@/types/api'

// Queue các request đang chờ khi đang refresh token
type QueueItem = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let failedQueue: QueueItem[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error)
    } else {
      item.resolve(token!)
    }
  })
  failedQueue = []
}

// Axios instance
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: đính kèm access token
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: xử lý 401 → refresh token → retry
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Bỏ qua nếu không phải 401, hoặc đã retry, hoặc đang gọi refresh
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login')
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Đưa request vào hàng chờ
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
          return http(original)
        })
        .catch(Promise.reject.bind(Promise))
    }

    original._retry = true
    isRefreshing = true

    const refreshToken = useAuthStore.getState().refreshToken

    if (!refreshToken) {
      useAuthStore.getState().clearAuth()
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post<ApiResponse<RefreshData>>(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
        { refreshToken },
      )

      const { accessToken, refreshToken: newRefreshToken } = data.data
      useAuthStore.getState().setTokens(accessToken, newRefreshToken)

      processQueue(null, accessToken)

      original.headers = { ...original.headers, Authorization: `Bearer ${accessToken}` }
      return http(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().clearAuth()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

// Helpers
export const get = <T>(url: string, config?: AxiosRequestConfig) =>
  http.get<ApiResponse<T>>(url, config).then((r) => r.data.data)

export const post = <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
  http.post<ApiResponse<T>>(url, body, config).then((r) => r.data.data)

export const put = <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
  http.put<ApiResponse<T>>(url, body, config).then((r) => r.data.data)

export const patch = <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
  http.patch<ApiResponse<T>>(url, body, config).then((r) => r.data.data)

export const del = <T>(url: string, config?: AxiosRequestConfig) =>
  http.delete<ApiResponse<T>>(url, config).then((r) => r.data.data)
