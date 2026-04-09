export type FlowStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

export type StepType = 'START' | 'SEQUENTIAL' | 'PARALLEL' | 'SUB_FLOW' | 'FINISH'

export type CompletionCondition = 'ALL' | 'ANY' | 'PERCENT'

export type SlaAction = 'AUTO_APPROVE' | 'AUTO_REJECT' | 'ESCALATE'

export type AssigneeType = 'ROLE' | 'USER' | 'DEPT_OWNER'

export type ActionType = 'START' | 'APPROVE' | 'REJECT' | 'REWORK' | 'TRANSFER' | 'EDIT' | 'SHARE' | 'FINISH' | 'CANCEL'

export interface AssigneeTemplate {
  id: number
  assigneeType: AssigneeType
  assigneeValue: string
}

export interface ActionTemplateItem {
  id: number | null
  actionType: ActionType
  name: string
}

export interface Transition {
  id: number
  fromStepId: number
  fromStepName: string
  toStepId: number | null
  toStepName: string | null
  actionType: ActionType
  conditionExpression: string | null
  priority: number
  isDefault: boolean
}

export interface FlowStep {
  id: number
  name: string
  stepOrder: number
  type: StepType
  completionCondition: CompletionCondition
  completionThreshold: number | null
  slaDuration: number | null
  slaAction: SlaAction | null
  /** Code của sub-flow. Chỉ có giá trị khi type = SUB_FLOW. */
  subFlowCode: string | null
  allowPickup: boolean
  assignees: AssigneeTemplate[]
  transitions: Transition[]
  allowedActions: ActionTemplateItem[]
}

export interface Flow {
  id: number
  code: string
  name: string
  status: FlowStatus
  version: number
  createdAt: string
  steps: FlowStep[]
}

export interface FlowSummary {
  id: number
  code: string
  name: string
  status: FlowStatus
  version: number
  createdAt: string
}

// Payloads
export interface CreateFlowPayload {
  code: string
  name: string
}

export interface CreateStepPayload {
  name: string
  stepOrder: number
  type: StepType
  completionCondition: CompletionCondition
  completionThreshold: number | null
  slaDuration: number | null
  slaAction: SlaAction | null
  subFlowCode: string | null
  maxRetries: number | null
  allowPickup: boolean
}

export interface UpdateStepPayload extends CreateStepPayload {}

export interface CreateAssigneePayload {
  assigneeType: AssigneeType
  assigneeValue: string
}

export interface CreateActionPayload {
  actionType: ActionType
  name: string
}

export interface CreateTransitionPayload {
  fromStepId: number
  toStepId: number | null
  actionType: ActionType
  conditionExpression: string | null
  priority: number
  isDefault: boolean
}

export interface UpdateTransitionPayload extends CreateTransitionPayload {}

// ── Workflow Runner types ────────────────────────────────────────

export type WorkflowStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ERROR'

export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ERROR'

export interface AssigneeInfo {
  userId: string
  displayName: string | null
  status: string
}

export interface ActionLogEntry {
  actionType: ActionType
  performedBy: string
  comment: string | null
  createdAt: string
}

export interface StepInstance {
  id: number
  stepName: string
  stepOrder: number
  stepType: StepType
  status: StepStatus | null
  startTime: string | null
  endTime: string | null
  dueTime: string | null
  assignees: AssigneeInfo[]
  allowedActions: ActionTemplateItem[]
  subWorkflowInstanceId: number | null
  subWorkflow: SubWorkflowSummary | null
}

export interface SubWorkflowSummary {
  id: number
  flowCode: string
  flowName: string
  status: WorkflowStatus
}

export interface WorkflowInstance {
  id: number
  flowCode: string
  flowName: string
  flowVersion: number
  businessKey: string
  status: WorkflowStatus
  createdBy: string
  createdAt: string
  parentStepInstanceId: number | null
  steps: StepInstance[]
}

export interface StepTimeline {
  stepOrder: number
  stepName: string
  stepType: StepType
  completionCondition: string
  status: StepStatus | null
  startTime: string | null
  endTime: string | null
  dueTime: string | null
  assignees: AssigneeInfo[]
  actionLogs: ActionLogEntry[]
  subFlowCode: string | null
  subWorkflowInstanceId: number | null
  subWorkflow: WorkflowTimeline | null
}

export interface WorkflowTimeline {
  id: number
  flowCode: string
  flowName: string
  flowVersion: number
  businessKey: string
  status: WorkflowStatus
  createdBy: string
  createdAt: string
  parentStepInstanceId: number | null
  steps: StepTimeline[]
}

export interface MyTask {
  workflowInstanceId: number
  stepInstanceId: number
  businessKey: string
  flowCode: string
  flowName: string
  stepName: string
  startTime: string | null
  dueTime: string | null
  allowedActions: ActionTemplateItem[]
}

export interface StartWorkflowPayload {
  flowCode: string
  businessKey: string
  contextData?: Record<string, unknown>
}

export interface SubmitActionPayload {
  workflowInstanceId: number
  stepInstanceId: number
  actionType: ActionType
  comment?: string
  transferToUserId?: string
}

export interface Delegation {
  id: number
  userId: string
  delegateeId: string
  startAt: string
  endAt: string | null
  active: boolean
  createdAt: string
}

export interface CreateDelegationPayload {
  delegateeId: string
  startAt: string
  endAt?: string | null
}
