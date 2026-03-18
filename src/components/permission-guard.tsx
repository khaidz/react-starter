import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router'
import { usePermission } from '@/hooks/use-permission'

interface PermissionGuardProps {
  roles?: string[]
  permissions?: string[]
  /** Fallback khi không có quyền. Mặc định redirect sang /403 */
  fallback?: ReactNode
}

/** Bọc quanh Route để bảo vệ theo role/permission */
export function PermissionGuard({ roles, permissions, fallback }: PermissionGuardProps) {
  const { can } = usePermission()

  if (!can(roles, permissions)) {
    return fallback ?? <Navigate to="/403" replace />
  }

  return <Outlet />
}

interface CanProps {
  roles?: string[]
  permissions?: string[]
  children: ReactNode
  /** Nội dung hiện khi không có quyền (mặc định null) */
  fallback?: ReactNode
}

/** Ẩn/hiện UI element theo role/permission */
export function Can({ roles, permissions, children, fallback = null }: CanProps) {
  const { can } = usePermission()
  return can(roles, permissions) ? <>{children}</> : <>{fallback}</>
}
