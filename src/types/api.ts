export interface ApiResponse<T = unknown> {
  requestId: string
  code: string
  message: string
  data: T
}

export interface User {
  id: string
  username: string
  email: string
  status: string
  roles: string[]
  permissions: string[]
  deptCode?: string
  deptName?: string
}

export interface AuthData {
  tokenType: string
  accessToken: string
  refreshToken: string
  user: User
}

export interface RefreshData {
  tokenType: string
  accessToken: string
  refreshToken: string
}

export interface PagedData<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type UserStatus = 'ACTIVE' | 'PENDING' | 'LOCKED' | 'DELETED'

export interface UserItem {
  id: string
  username: string
  email: string
  status: UserStatus
  roles: string[]
  deptCode?: string
  deptName?: string
  isDepartmentOwner?: boolean
}

export interface Role {
  id: string
  name: string
}

export interface RoleItem {
  id: string
  name: string
  description?: string
  permissions: PermissionItem[]
}

export interface Department {
  id: string
  name: string
  code: string
  path?: string
  depth?: number
  active: boolean
}

export interface DepartmentItem {
  id: string
  name: string
  code: string
  description?: string
  path?: string
  depth?: number
  active: boolean
  ownerUsername?: string | null
  parent?: { id: string; name: string; code: string; active: boolean } | null
}

export type ApiKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export interface ApiKeyItem {
  id: string
  name: string
  description?: string
  keyValue: string
  status: ApiKeyStatus
  expired: boolean
  expiresAt?: string | null
  createdAt: string
  allowedPermissions: Array<{ id: string; name: string }>
}

export interface DepartmentTreeNode {
  id: string
  code: string
  name: string
  depth: number
  isActive: boolean
  ownerUsername?: string | null
  children: DepartmentTreeNode[]
}

export interface PermissionItem {
  id: string
  name: string
  description?: string
}

export type JobStatus = 'RUNNING' | 'SUCCESS' | 'FAILED'

export interface JobLastRun {
  id: string
  startedAt: string
  endedAt?: string
  status: JobStatus
  triggeredBy: string
  message?: string
}

export interface JobItem {
  name: string
  description?: string
  cron: string
  enabled: boolean
  lastRun?: JobLastRun
}

export interface JobLogItem {
  id: string
  jobName: string
  startedAt: string
  endedAt?: string
  status: JobStatus
  triggeredBy: string
  message?: string
}

// ── Leave Management ──────────────────────────────────────────────────────────

export interface LeaveTypeItem {
  id: string
  name: string
  description?: string
  maxDaysPerYear: number
  isPaid: boolean
  isActive: boolean
}

export interface LeaveBalanceItem {
  id: string
  username: string
  email: string
  leaveTypeId: string
  leaveTypeName: string
  year: number
  totalDays: number
  usedDays: number
  remainingDays: number
}

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeaveRequestItem {
  id: string
  requesterUsername: string
  requesterEmail: string
  leaveTypeId: string
  leaveTypeName: string
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  status: LeaveRequestStatus
  approverUsername?: string
  approverComment?: string
  processedAt?: string
  createdAt: string
}
