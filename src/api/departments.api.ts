import { del, get, post, put } from '@/lib/http'
import type { DepartmentItem, DepartmentTreeNode, PagedData } from '@/types/api'

export interface DepartmentSearchParams {
  name?: string
  code?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string[]
}


export interface CreateDepartmentPayload {
  parentId: string | null
  name: string
  code: string
  description?: string
  isActive?: boolean
}

export interface UpdateDepartmentPayload {
  parentId?: string | null
  name: string
  code: string
  isActive?: boolean
}

export interface MoveDepartmentPayload {
  newParentId: string | null
}

export interface DeleteDepartmentPayload {
  cascade?: boolean
}

export const departmentsApi = {
  search: ({ name, code, active }: DepartmentSearchParams = {}) =>
    post<PagedData<DepartmentItem>>('/api/v1/departments/search', { name, code, active }, { params: { size: 1000 } }).then((r) => r.content),

  searchPaged: ({ name, code, active, page, size, sort }: DepartmentSearchParams = {}) =>
    post<PagedData<DepartmentItem>>('/api/v1/departments/search', { name, code, active }, { params: { page, size, sort } }),

  getById: (id: string) =>
    get<DepartmentItem>(`/api/v1/departments/${id}`),

  getTree: (deptId?: string) =>
    get<DepartmentTreeNode>('/api/v1/departments/tree', { params: deptId ? { deptId } : undefined }),

  getChildren: (deptId: string) =>
    get<DepartmentItem[]>('/api/v1/departments/children', { params: { deptId } }),

  create: (payload: CreateDepartmentPayload) =>
    post<DepartmentItem>('/api/v1/departments', payload),

  update: (id: string, payload: UpdateDepartmentPayload) =>
    put<DepartmentItem>(`/api/v1/departments/${id}`, payload),

  move: (id: string, payload: MoveDepartmentPayload) =>
    post<void>(`/api/v1/departments/${id}/move`, payload),

  delete: (id: string, payload?: DeleteDepartmentPayload) =>
    del<void>(`/api/v1/departments/${id}`, { data: payload }),
}
