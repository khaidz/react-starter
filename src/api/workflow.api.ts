import { del, get, post, put } from '@/lib/http'
import type {
  CreateActionPayload,
  CreateAssigneePayload,
  CreateFlowPayload,
  CreateStepPayload,
  CreateTransitionPayload,
  Flow,
  FlowSummary,
  UpdateStepPayload,
  UpdateTransitionPayload,
} from '@/types/workflow'

export const adminFlowsApi = {
  list: () =>
    get<FlowSummary[]>('/api/v1/admin/flows'),

  getDetail: (flowId: number) =>
    get<Flow>(`/api/v1/admin/flows/${flowId}`),

  create: (payload: CreateFlowPayload) =>
    post<FlowSummary>('/api/v1/admin/flows', payload),

  delete: (flowId: number) =>
    del<void>(`/api/v1/admin/flows/${flowId}`),

  activate: (flowId: number) =>
    post<FlowSummary>(`/api/v1/admin/flows/${flowId}/activate`),

  deactivate: (flowId: number) =>
    post<FlowSummary>(`/api/v1/admin/flows/${flowId}/deactivate`),

  newVersion: (flowId: number) =>
    post<FlowSummary>(`/api/v1/admin/flows/${flowId}/new-version`),

  // Steps — trả về FlowDetailResponse (full detail sau khi thay đổi)
  addStep: (flowId: number, payload: CreateStepPayload) =>
    post<Flow>(`/api/v1/admin/flows/${flowId}/steps`, payload),

  updateStep: (stepId: number, payload: UpdateStepPayload) =>
    put<Flow>(`/api/v1/admin/flows/steps/${stepId}`, payload),

  deleteStep: (stepId: number) =>
    del<void>(`/api/v1/admin/flows/steps/${stepId}`),

  // Assignees
  addAssignee: (stepId: number, payload: CreateAssigneePayload) =>
    post<Flow>(`/api/v1/admin/flows/steps/${stepId}/assignees`, payload),

  deleteAssignee: (assigneeTemplateId: number) =>
    del<void>(`/api/v1/admin/flows/assignees/${assigneeTemplateId}`),

  // Action templates
  addAction: (stepId: number, payload: CreateActionPayload) =>
    post<Flow>(`/api/v1/admin/flows/steps/${stepId}/actions`, payload),

  deleteAction: (actionTemplateId: number) =>
    del<void>(`/api/v1/admin/flows/actions/${actionTemplateId}`),

  // Transitions
  addTransition: (payload: CreateTransitionPayload) =>
    post<Flow>('/api/v1/admin/flows/transitions', payload),

  updateTransition: (transitionId: number, payload: UpdateTransitionPayload) =>
    put<Flow>(`/api/v1/admin/flows/transitions/${transitionId}`, payload),

  deleteTransition: (transitionId: number) =>
    del<void>(`/api/v1/admin/flows/transitions/${transitionId}`),
}
