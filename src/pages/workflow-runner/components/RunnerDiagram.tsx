import dagre from 'dagre'
import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Loader, Text } from '@mantine/core'
import type { StepTimeline } from '@/types/workflow'

// ── Constants ──────────────────────────────────────────────────────────────────

const NODE_W = 220
const NODE_H = 84

const STATUS_BORDER: Record<string, string> = {
  PENDING: '#ced4da',
  IN_PROGRESS: '#228be6',
  WAITING_SUB_FLOW: '#7048e8',
  COMPLETED: '#2f9e44',
  REJECTED: '#e03131',
  CANCELLED: '#868e96',
}

const STATUS_BG: Record<string, string> = {
  PENDING: '#f8f9fa',
  IN_PROGRESS: '#e7f5ff',
  WAITING_SUB_FLOW: '#f3f0ff',
  COMPLETED: '#ebfbee',
  REJECTED: '#fff5f5',
  CANCELLED: '#f8f9fa',
}

const STATUS_TEXT: Record<string, string> = {
  PENDING: '#868e96',
  IN_PROGRESS: '#1971c2',
  WAITING_SUB_FLOW: '#5f3dc4',
  COMPLETED: '#2f9e44',
  REJECTED: '#c92a2a',
  CANCELLED: '#868e96',
}

const ACTION_COLOR: Record<string, string> = {
  APPROVE: '#2f9e44',
  REJECT: '#e03131',
  REWORK: '#e67700',
  CANCEL: '#c92a2a',
  FINISH: '#0ca678',
  TRANSFER: '#6741d9',
  START: '#868e96',
  EDIT_REQUEST: '#1971c2',
  RECALL: '#f08c00',
  PICKUP: '#0c8599',
}

// ── Dagre layout ───────────────────────────────────────────────────────────────

function buildLayout(steps: StepTimeline[]) {
  const g = new dagre.graphlib.Graph({ multigraph: true })
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 })

  steps.forEach((s) => g.setNode(`s${s.stepOrder}`, { width: NODE_W, height: NODE_H }))

  // Kết nối theo stepOrder — edge từ step có actionLog tới step tiếp theo
  for (let i = 0; i < steps.length - 1; i++) {
    g.setEdge(`s${steps[i].stepOrder}`, `s${steps[i + 1].stepOrder}`, {}, `e${i}`)
  }

  dagre.layout(g)
  return g
}

// ── Custom node ────────────────────────────────────────────────────────────────

type StepNodeData = { step: StepTimeline }

function StepNode({ data }: NodeProps & { data: StepNodeData }) {
  const { step } = data
  const status = step.status ?? 'PENDING'
  const border = STATUS_BORDER[status] ?? '#ced4da'
  const bg = STATUS_BG[status] ?? '#f8f9fa'
  const textColor = STATUS_TEXT[status] ?? '#868e96'
  const isStart = step.stepType === 'START'
  const isFinish = step.stepType === 'FINISH'

  const lastAction = step.actionLogs?.length
    ? step.actionLogs[step.actionLogs.length - 1]
    : null

  return (
    <div
      style={{
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 8,
        padding: '6px 10px',
        width: NODE_W,
        minHeight: NODE_H,
        boxShadow: status === 'IN_PROGRESS' ? `0 0 0 3px ${border}33` : '0 1px 4px rgba(0,0,0,0.08)',
        fontFamily: 'var(--mantine-font-family)',
      }}
    >
      {!isStart && <Handle type="target" position={Position.Left} style={{ background: border }} />}

      <div style={{ fontSize: 10, color: textColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>{step.stepOrder}. {step.stepType}</span>
        {status !== 'PENDING' && (
          <span style={{ opacity: 0.8 }}>• {status}</span>
        )}
        {status === 'IN_PROGRESS' && (
          <Loader size={10} color={textColor} />
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3, marginBottom: 4 }}>
        {step.stepName}
      </div>

      {step.assignees?.length > 0 && (
        <div style={{ fontSize: 10, color: '#868e96', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {step.assignees.map((a) => a.displayName ?? a.userId).join(', ')}
        </div>
      )}

      {lastAction && (
        <div style={{
          fontSize: 9,
          color: ACTION_COLOR[lastAction.actionType] ?? '#868e96',
          background: (ACTION_COLOR[lastAction.actionType] ?? '#868e96') + '18',
          border: `1px solid ${(ACTION_COLOR[lastAction.actionType] ?? '#868e96')}44`,
          borderRadius: 3,
          padding: '1px 5px',
          display: 'inline-block',
          fontWeight: 600,
        }}>
          {lastAction.actionType} — {lastAction.performedBy}
        </div>
      )}

      {!isFinish && <Handle type="source" position={Position.Right} style={{ background: border }} />}
    </div>
  )
}

const nodeTypes = { stepNode: StepNode as any }

// ── Auto fit ───────────────────────────────────────────────────────────────────

function AutoFitView({ isActive }: { isActive: boolean }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    if (isActive) setTimeout(() => fitView({ padding: 0.2 }), 50)
  }, [isActive])
  return null
}

// ── Build nodes/edges ──────────────────────────────────────────────────────────

function buildNodesEdges(steps: StepTimeline[]): { nodes: Node[]; edges: Edge[] } {
  if (steps.length === 0) return { nodes: [], edges: [] }

  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)
  const g = buildLayout(sorted)

  const nodes: Node[] = sorted.map((s) => {
    const pos = g.node(`s${s.stepOrder}`)
    return {
      id: `s${s.stepOrder}`,
      type: 'stepNode',
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: { step: s } as StepNodeData,
    }
  })

  const edges: Edge[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]
    const lastAction = from.actionLogs?.[from.actionLogs.length - 1]
    const color = lastAction ? (ACTION_COLOR[lastAction.actionType] ?? '#ced4da') : '#ced4da'
    const label = lastAction?.actionType

    edges.push({
      id: `e${i}`,
      source: `s${from.stepOrder}`,
      target: `s${sorted[i + 1].stepOrder}`,
      ...(label ? {
        label,
        labelStyle: { fontSize: 10, fontWeight: 600, fill: color },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
        labelBgPadding: [4, 3] as [number, number],
        labelBgBorderRadius: 3,
      } : {}),
      style: { stroke: color, strokeWidth: 1.5, strokeDasharray: !lastAction ? '5 4' : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      type: 'smoothstep',
    })
  }

  return { nodes, edges }
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  steps: StepTimeline[]
  isActive?: boolean
}

export function RunnerDiagram({ steps, isActive = false }: Props) {
  const initial = useMemo(() => buildNodesEdges(steps), [steps])
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)

  useEffect(() => {
    const { nodes: n, edges: e } = buildNodesEdges(steps)
    setNodes(n)
    setEdges(e)
  }, [steps])

  if (steps.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl" fs="italic">
        No steps to display.
      </Text>
    )
  }

  return (
    <div style={{ height: '100%', minHeight: 400, border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <AutoFitView isActive={isActive} />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="#ced4da" />
        <Controls />
        <MiniMap
          nodeColor={(n) => STATUS_BORDER[(n.data as StepNodeData)?.step?.status ?? 'PENDING'] ?? '#ced4da'}
          maskColor="rgba(255,255,255,0.6)"
        />
      </ReactFlow>
    </div>
  )
}
