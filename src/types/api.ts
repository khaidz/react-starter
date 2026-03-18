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
