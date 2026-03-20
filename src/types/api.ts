export interface ApiResponse<T = unknown> {
  requestId: string
  code: string
  message: string
  data: T
}

export interface User {
  id: number
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
  id: number
  username: string
  email: string
  status: UserStatus
  roles: string[]
  deptCode?: string
  deptName?: string
}

export interface Role {
  id: number
  name: string
}

export interface Department {
  id: number
  name: string
  code: string
  path?: string
  depth?: number
  active: boolean
}
