import { del, get, post, put } from '@/lib/http'
import type { DepartmentItem, DepartmentTreeNode } from '@/types/api'

export interface DepartmentSearchParams {
  keyword?: string
  activeOnly?: boolean
  page?: number
  size?: number
}

export interface CreateDepartmentPayload {
  parentId: number
  name: string
  code: string
  description?: string
  isActive?: boolean
}

export interface UpdateDepartmentPayload {
  parentId?: number | null
  name: string
  code: string
  isActive?: boolean
}

export interface MoveDepartmentPayload {
  newParentId: number | null
}

export interface DeleteDepartmentPayload {
  cascade?: boolean
}

export const departmentsApi = {
  search: (params?: DepartmentSearchParams) =>
    get<DepartmentItem[]>('/api/v1/departments/search', { params }),

  getById: (id: number) =>
    get<DepartmentItem>(`/api/v1/departments/${id}`),

  getTree: (deptId?: number) =>
    get<DepartmentTreeNode>('/api/v1/departments/tree', { params: deptId ? { deptId } : undefined }),

  getChildren: (deptId: number) =>
    get<DepartmentItem[]>('/api/v1/departments/children', { params: { deptId } }),

  create: (payload: CreateDepartmentPayload) =>
    post<DepartmentItem>('/api/v1/departments', payload),

  update: (id: number, payload: UpdateDepartmentPayload) =>
    put<DepartmentItem>(`/api/v1/departments/${id}`, payload),

  move: (id: number, payload: MoveDepartmentPayload) =>
    post<void>(`/api/v1/departments/${id}/move`, payload),

  delete: (id: number, payload?: DeleteDepartmentPayload) =>
    del<void>(`/api/v1/departments/${id}`, { data: payload }),
}
