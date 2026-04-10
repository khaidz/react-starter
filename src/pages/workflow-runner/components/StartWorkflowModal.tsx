import { useState } from 'react'
import { Button, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { adminFlowsApi, workflowApi } from '@/api/workflow.api'
import { notifyError } from '@/lib/notify'
import type { FlowSummary, WorkflowInstance } from '@/types/workflow'

interface Props {
  opened: boolean
  onClose: () => void
  onStarted: (instance: WorkflowInstance) => void
}

export function StartWorkflowModal({ opened, onClose, onStarted }: Props) {
  const [flowCode, setFlowCode] = useState<string | null>(null)
  const [businessKey, setBusinessKey] = useState('')
  const [contextDataRaw, setContextDataRaw] = useState('')

  const { data } = useQuery({
    queryKey: ['admin-flows'],
    queryFn: adminFlowsApi.list,
    enabled: opened,
  })

  const allFlows: FlowSummary[] = Array.isArray(data)
    ? (data as FlowSummary[])
    : ((data as unknown as { content?: FlowSummary[] })?.content ?? [])

  const activeFlows = allFlows.filter((f) => f.status === 'ACTIVE')

  const flowOptions = activeFlows.map((f) => ({
    value: f.code,
    label: `${f.code} — ${f.name} (v${f.version})`,
  }))

  const startMutation = useMutation({
    mutationFn: () => {
      let contextData: Record<string, unknown> | undefined
      if (contextDataRaw.trim()) {
        try {
          contextData = JSON.parse(contextDataRaw)
        } catch {
          throw new Error('Context data must be valid JSON')
        }
      }
      return workflowApi.start({ flowCode: flowCode!, businessKey, contextData })
    },
    onSuccess: (instance) => {
      notifications.show({ message: 'Workflow started successfully', color: 'green' })
      handleClose()
      onStarted(instance)
    },
    onError: (error) => notifyError(error),
  })

  function handleClose() {
    setFlowCode(null)
    setBusinessKey('')
    setContextDataRaw('')
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Start New Workflow" size="md">
      <Stack gap="sm">
        <Select
          label="Flow"
          placeholder="Select flow (ACTIVE only)"
          data={flowOptions}
          value={flowCode}
          onChange={setFlowCode}
          searchable
          required
        />
        <TextInput
          label="Business Key"
          placeholder="e.g. ORDER-001, REQ-2024-01"
          value={businessKey}
          onChange={(e) => setBusinessKey(e.target.value)}
          required
        />
        <Textarea
          label="Context Data (JSON, optional)"
          placeholder='{"amount": 5000, "department": "IT"}'
          value={contextDataRaw}
          onChange={(e) => setContextDataRaw(e.target.value)}
          rows={3}
          autosize
          minRows={2}
          maxRows={6}
          styles={{ input: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => startMutation.mutate()}
            loading={startMutation.isPending}
            disabled={!flowCode || !businessKey.trim()}
          >
            Start
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
