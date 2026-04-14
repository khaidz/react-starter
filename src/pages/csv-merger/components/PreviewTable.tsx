import { useState } from 'react'
import { Group, Pagination, ScrollArea, Select, Table, Text } from '@mantine/core'
import { COL_FORMAT_OPTIONS, type CsvFile, type ColFormatType } from '../types'

const PAGE_SIZE_OPTIONS = [
  { value: '25',  label: '25 / page' },
  { value: '50',  label: '50 / page' },
  { value: '100', label: '100 / page' },
  { value: '200', label: '200 / page' },
  { value: '500', label: '500 / page' },
]

function formatCellValue(value: string, fmt: ColFormatType): string {
  if (!value.trim() || fmt === 'text') return value

  if (fmt === 'integer') {
    const n = parseFloat(value.replace(/,/g, ''))
    return isNaN(n) ? value : Math.round(n).toLocaleString()
  }
  if (fmt === 'number') {
    const n = parseFloat(value.replace(/,/g, ''))
    return isNaN(n) ? value : n.toLocaleString()
  }
  if (fmt === 'decimal2') {
    const n = parseFloat(value.replace(/,/g, ''))
    return isNaN(n) ? value : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (fmt === 'percentage') {
    const n = parseFloat(value.replace('%', '').replace(/,/g, ''))
    if (isNaN(n)) return value
    return (Math.abs(n) > 1 ? n : n * 100).toFixed(2) + '%'
  }
  if (fmt === 'date_dmy' || fmt === 'date_ymd' || fmt === 'datetime') {
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    const dd   = d.getDate().toString().padStart(2, '0')
    const mm   = (d.getMonth() + 1).toString().padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh   = d.getHours().toString().padStart(2, '0')
    const min  = d.getMinutes().toString().padStart(2, '0')
    if (fmt === 'date_dmy') return `${dd}/${mm}/${yyyy}`
    if (fmt === 'date_ymd') return `${yyyy}-${mm}-${dd}`
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`
  }
  return value
}

interface Props {
  file: CsvFile
  onFormatChange?: (colIndex: number, fmt: ColFormatType) => void
}

export function PreviewTable({ file, onFormatChange }: Props) {
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const totalPages = Math.max(1, Math.ceil(file.rowCount / pageSize))
  const start      = (page - 1) * pageSize
  const rows       = file.rows.slice(start, start + pageSize)

  const handlePageSizeChange = (val: string | null) => {
    if (!val) return
    setPageSize(Number(val))
    setPage(1)
  }

  return (
    <div>
      <ScrollArea h={650}>
        <Table striped withTableBorder withColumnBorders fz="xs" style={{ minWidth: 400 }}>
          <Table.Thead>
            {/* Row 1: column names */}
            <Table.Tr>
              {file.headers.map((h, i) => (
                <Table.Th key={i} style={{ whiteSpace: 'nowrap' }}>
                  {h || `Column ${i + 1}`}
                </Table.Th>
              ))}
            </Table.Tr>

            {/* Row 2: format selectors */}
            {onFormatChange && (
              <Table.Tr style={{ background: '#f3f0ff' }}>
                {file.headers.map((_, ci) => (
                  <Table.Th key={ci} style={{ padding: '4px 6px', fontWeight: 'normal' }}>
                    <Select
                      size="xs"
                      value={file.colFormats[ci] ?? 'text'}
                      data={COL_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      onChange={(v) => v && onFormatChange(ci, v as ColFormatType)}
                      allowDeselect={false}
                      styles={{ input: { fontSize: 11, minHeight: 24, height: 24, paddingTop: 0, paddingBottom: 0 } }}
                      style={{ minWidth: 140 }}
                    />
                  </Table.Th>
                ))}
              </Table.Tr>
            )}
          </Table.Thead>

          <Table.Tbody>
            {rows.map((row, ri) => (
              <Table.Tr key={start + ri}>
                {file.headers.map((_, ci) => {
                  const raw = row[ci] ?? ''
                  const fmt = file.colFormats[ci]
                  const display = fmt && fmt !== 'text' ? formatCellValue(raw, fmt) : raw
                  return (
                    <Table.Td key={ci} style={{ whiteSpace: 'nowrap' }}>
                      {display}
                    </Table.Td>
                  )
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Group justify="space-between" align="center" mt="sm">
        <Text size="xs" c="dimmed">
          Rows {start + 1}–{Math.min(start + pageSize, file.rowCount)} of {file.rowCount.toLocaleString()}
        </Text>

        <Group gap="xs">
          <Select
            size="xs"
            value={String(pageSize)}
            data={PAGE_SIZE_OPTIONS}
            onChange={handlePageSizeChange}
            allowDeselect={false}
            style={{ width: 110 }}
          />
          {totalPages > 1 && (
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="xs"
              siblings={1}
              boundaries={1}
            />
          )}
        </Group>
      </Group>
    </div>
  )
}
