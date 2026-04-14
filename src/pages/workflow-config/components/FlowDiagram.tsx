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
import { Text } from '@mantine/core'
import type { FlowStep } from '@/types/workflow'

// ── Constants ──────────────────────────────────────────────────────────────────

const NODE_W = 200
const NODE_H = 76

const STEP_COLOR: Record<string, string> = {
  START: '#0ca678',
  SEQUENTIAL: '#228be6',
  PARALLEL: '#7048e8',
  SUB_FLOW: '#e67700',
  FINISH: '#868e96',
}

const ACTION_COLOR: Record<string, string> = {
  APPROVE: '#2f9e44',
  REJECT: '#e03131',
  CANCEL: '#c92a2a',
  FINISH: '#0ca678',
  TRANSFER: '#6741d9',
  START: '#868e96',
  EDIT_REQUEST: '#1971c2',
  RECALL: '#f08c00',
  ADD_ASSIGNEE: '#9c36b5',
}

// ── Dagre layout ───────────────────────────────────────────────────────────────

function buildLayout(steps: FlowStep[]) {
  const g = new dagre.graphlib.Graph({ multigraph: true })
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80, edgesep: 20 })

  steps.forEach((s) => g.setNode(`s${s.id}`, { width: NODE_W, height: NODE_H }))

  const hasNullTarget = steps.some((s) => s.transitions.some((t) => t.toStepId == null))
  if (hasNullTarget) g.setNode('__end__', { width: 60, height: 60 })

  steps.forEach((s) =>
    s.transitions.forEach((t) => {
      const src = `s${t.fromStepId}`
      const tgt = t.toStepId ? `s${t.toStepId}` : '__end__'
      g.setEdge(src, tgt, {}, `e${t.id}`)
    }),
  )

  dagre.layout(g)
  return g
}

// ── Custom node: Step ──────────────────────────────────────────────────────────

type StepNodeData = { step: FlowStep }

function StepNode({ data }: NodeProps & { data: StepNodeData }) {
  const { step } = data
  const color = STEP_COLOR[step.type] ?? '#868e96'
  const isStart = step.type === 'START'
  const isFinish = step.type === 'FINISH'

  return (
    <div
      style={{
        background: '#fff',
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: '6px 10px',
        width: NODE_W,
        minHeight: NODE_H,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        fontFamily: 'var(--mantine-font-family)',
      }}
    >
      {!isStart && <Handle type="target" position={Position.Left} style={{ background: color }} />}

      <div style={{ fontSize: 10, color, fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {step.stepOrder}. {step.type}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3, marginBottom: 4 }}>
        {step.name}
      </div>
      {step.allowedActions.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {step.allowedActions.map((a) => (
            <span
              key={a.actionType}
              style={{
                fontSize: 9,
                background: (ACTION_COLOR[a.actionType] ?? '#868e96') + '22',
                color: ACTION_COLOR[a.actionType] ?? '#868e96',
                border: `1px solid ${(ACTION_COLOR[a.actionType] ?? '#868e96')}55`,
                borderRadius: 3,
                padding: '1px 5px',
                fontWeight: 600,
              }}
            >
              {a.actionType}
            </span>
          ))}
        </div>
      )}

      {!isFinish && <Handle type="source" position={Position.Right} style={{ background: color }} />}
    </div>
  )
}

// ── Custom node: End ───────────────────────────────────────────────────────────

function EndNode() {
  return (
    <div
      style={{
        background: '#f1f3f5',
        border: '2px solid #868e96',
        borderRadius: '50%',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: '#868e96',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#868e96' }} />
      END
    </div>
  )
}

const nodeTypes = { stepNode: StepNode as any, endNode: EndNode }

// ── Main component ─────────────────────────────────────────────────────────────

// ── Auto fit when tab becomes visible ─────────────────────────────────────────

function AutoFitView({ isActive }: { isActive: boolean }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    if (isActive) {
      setTimeout(() => fitView({ padding: 0.2 }), 50)
    }
  }, [isActive])
  return null
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  steps: FlowStep[]
  isActive?: boolean
}

function buildNodesEdges(steps: FlowStep[]): { nodes: Node[]; edges: Edge[] } {
  if (steps.length === 0) return { nodes: [], edges: [] }

  const g = buildLayout(steps)

  const nodes: Node[] = steps.map((s) => {
    const pos = g.node(`s${s.id}`)
    return {
      id: `s${s.id}`,
      type: 'stepNode',
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: { step: s } as StepNodeData,
    }
  })

  const hasNullTarget = steps.some((s) => s.transitions.some((t) => t.toStepId == null))
  if (hasNullTarget) {
    const pos = g.node('__end__')
    nodes.push({
      id: '__end__',
      type: 'endNode',
      position: { x: pos.x - 30, y: pos.y - 30 },
      data: {},
    })
  }

  const edges: Edge[] = steps.flatMap((s) =>
    s.transitions.map((t) => {
      const color = ACTION_COLOR[t.actionType] ?? '#868e96'
      const label = t.conditionExpression
        ? `${t.actionType}: ${t.conditionExpression}`
        : t.actionType
      return {
        id: `e${t.id}`,
        source: `s${t.fromStepId}`,
        target: t.toStepId ? `s${t.toStepId}` : '__end__',
        label,
        labelStyle: { fontSize: 10, fontWeight: 600, fill: color },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
        labelBgPadding: [4, 3] as [number, number],
        labelBgBorderRadius: 3,
        style: { stroke: color, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
        type: 'smoothstep',
      }
    }),
  )

  return { nodes, edges }
}

export function FlowDiagram({ steps, isActive = false }: Props) {
  const initial = useMemo(() => buildNodesEdges(steps), [steps])

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)

  // Re-layout khi steps thay đổi (thêm/xóa step hoặc transition)
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
    <div style={{ height: 560, border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8, overflow: 'hidden' }}>
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
          nodeColor={(n) => {
            if (n.id === '__end__') return '#868e96'
            const step = (n.data as StepNodeData)?.step
            return STEP_COLOR[step?.type ?? ''] ?? '#868e96'
          }}
          maskColor="rgba(255,255,255,0.6)"
        />
      </ReactFlow>
    </div>
  )
}
