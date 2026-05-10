import type { JobStatus } from '@/types/api'

export const STATUS_COLOR: Record<JobStatus, string> = {
  SUCCESS: 'green',
  FAILED: 'red',
  RUNNING: 'blue',
}

export function formatDuration(startedAt?: string, endedAt?: string) {
  if (!startedAt || !endedAt) return null
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function formatRelative(dateStr?: string) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(dateStr).toLocaleDateString()
}

export function formatDateTime(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}
