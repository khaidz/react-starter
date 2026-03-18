import { useAuth } from '@/hooks/use-auth'

export function usePermission() {
  const { user } = useAuth()

  const hasRole = (role: string | string[]): boolean => {
    if (!user?.roles?.length) return false
    const list = Array.isArray(role) ? role : [role]
    return list.some((r) => user.roles.includes(r))
  }

  const hasPermission = (permission: string | string[]): boolean => {
    if (!user?.permissions?.length) return false
    const list = Array.isArray(permission) ? permission : [permission]
    return list.some((p) => user.permissions.includes(p))
  }

  /**
   * Trả về true nếu user có ít nhất một trong các roles HOẶC permissions yêu cầu.
   * Không truyền gì → luôn cho phép.
   */
  const can = (roles?: string[], permissions?: string[]): boolean => {
    if (!roles?.length && !permissions?.length) return true
    if (roles?.length && hasRole(roles)) return true
    if (permissions?.length && hasPermission(permissions)) return true
    return false
  }

  return { hasRole, hasPermission, can }
}
