import { del, get, post, put } from '@/lib/http'
import type {
  CreateActionPayload,
  CreateAssigneePayload,
  CreateDelegationPayload,
  CreateFlowPayload,
  CreateStepPayload,
  CreateTransitionPayload,
  Delegation,
  Flow,
  FlowSummary,
  MyTask,
  StartWorkflowPayload,
  SubmitActionPayload,
  UpdateStepPayload,
  UpdateTransitionPayload,
  WorkflowInstance,
  WorkflowStatus,
  WorkflowTimeline,
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

export const workflowApi = {
  start: (payload: StartWorkflowPayload) =>
    post<WorkflowInstance>('/api/v1/workflows/start', payload),

  submitAction: (payload: SubmitActionPayload) =>
    post<void>('/api/v1/workflows/action', payload),

  cancel: (id: number, comment?: string) =>
    post<void>(`/api/v1/workflows/${id}/cancel`, undefined, { params: { comment } }),

  getInstance: (id: number) =>
    get<WorkflowInstance>(`/api/v1/workflows/${id}`),

  getTimeline: (id: number) =>
    get<WorkflowTimeline>(`/api/v1/workflows/${id}/timeline`),

  search: (params?: { businessKey?: string; status?: WorkflowStatus; flowCode?: string }) =>
    get<WorkflowInstance[]>('/api/v1/workflows', { params }),

  getMyTasks: (params?: { flowCode?: string; businessKey?: string; page?: number; size?: number }) =>
    get<{ content: MyTask[]; totalElements: number }>('/api/v1/workflows/my-tasks', { params }),

  getPickupTasks: (flowCode?: string) =>
    get<MyTask[]>('/api/v1/workflows/pickup-tasks', { params: { flowCode } }),

  pickup: (workflowInstanceId: number, stepInstanceId: number, comment?: string) =>
    post<void>(`/api/v1/workflows/${workflowInstanceId}/steps/${stepInstanceId}/pickup`, undefined, {
      params: { comment },
    }),

  createDelegation: (payload: CreateDelegationPayload) =>
    post<Delegation>('/api/v1/workflows/delegations', payload),

  cancelDelegation: (id: number) =>
    del<void>(`/api/v1/workflows/delegations/${id}`),

  getMyDelegations: () =>
    get<Delegation[]>('/api/v1/workflows/delegations/my'),
}
