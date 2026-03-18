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
