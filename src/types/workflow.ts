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
  /** Map: actionType → displayName (không có id riêng trong response) */
  allowedActions: Partial<Record<ActionType, string>>
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
