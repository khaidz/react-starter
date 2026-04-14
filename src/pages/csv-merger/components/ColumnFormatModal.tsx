import { Badge, Modal, Select, Table, Text } from '@mantine/core'
import { COL_FORMAT_OPTIONS, type CsvFile, type ColFormatType } from '../types'

interface Props {
  file: CsvFile | null
  onClose: () => void
  onChange: (colFormats: Record<number, ColFormatType>) => void
}

const SAMPLE_COUNT = 3

export function ColumnFormatModal({ file, onClose, onChange }: Props) {
  if (!file) return null

  const handleChange = (colIndex: number, value: ColFormatType) => {
    onChange({ ...file.colFormats, [colIndex]: value })
  }

  return (
    <Modal
      opened={file !== null}
      onClose={onClose}
      title={
        <Text fw={600} size="sm">
          Column formats —{' '}
          <Text span c="dimmed" fw={400}>{file.name}</Text>
        </Text>
      }
      size="xl"
    >
      <Table withTableBorder withColumnBorders fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>#</Table.Th>
            <Table.Th>Column</Table.Th>
            <Table.Th>Sample values</Table.Th>
            <Table.Th w={210}>Format</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {file.headers.map((header, ci) => {
            const samples = file.rows
              .map((r) => r[ci])
              .filter((v) => v !== undefined && v !== '')
              .slice(0, SAMPLE_COUNT)

            const currentFormat = file.colFormats[ci] ?? 'text'

            return (
              <Table.Tr key={ci}>
                <Table.Td c="dimmed">{ci + 1}</Table.Td>
                <Table.Td fw={500}>{header || `Column ${ci + 1}`}</Table.Td>
                <Table.Td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {samples.length > 0
                      ? samples.map((s, i) => (
                          <Badge key={i} variant="light" color="gray" size="sm" fw={400}>
                            {s}
                          </Badge>
                        ))
                      : <Text size="xs" c="dimmed">—</Text>
                    }
                  </div>
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    value={currentFormat}
                    data={COL_FORMAT_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    onChange={(v) => v && handleChange(ci, v as ColFormatType)}
                    allowDeselect={false}
                  />
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Modal>
  )
}
