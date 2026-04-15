import { useState } from 'react'
import type { ColFormatType } from '@/pages/csv-merger/types'
import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import { IconFileSpreadsheet, IconUpload, IconX } from '@tabler/icons-react'
import * as XLSX from 'xlsx'
import type { CsvFile } from '@/pages/csv-merger/types'
import { PreviewTable } from '@/pages/csv-merger/components/PreviewTable'
import styles from './excel-viewer.module.scss'

interface ExcelFile {
  name: string
  sheets: CsvFile[]
}

function formatDateCell(d: Date): string {
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  const hh   = String(d.getHours()).padStart(2, '0')
  const min  = String(d.getMinutes()).padStart(2, '0')
  // Show time only when it's not midnight
  return (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0)
    ? `${dd}/${mm}/${yyyy}`
    : `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function cellToString(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (val instanceof Date) return formatDateCell(val)
  return String(val)
}

function readExcel(file: File): Promise<ExcelFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer
        // cellDates: true → SheetJS trả về Date object thay vì serial number
        const wb = XLSX.read(data, { type: 'array', dense: true, cellDates: true })

        const sheets: CsvFile[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name]
          const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
            header: 1,
            defval: '',
            blankrows: false,
          })

          const [headerRow = [], ...dataRows] = raw as unknown[][]
          const headers = (headerRow as unknown[]).map((h) => cellToString(h))
          const rows = dataRows.map((r) =>
            headers.map((_, ci) => cellToString((r as unknown[])[ci])),
          )

          return {
            id: `${name}-${Date.now()}`,
            name: file.name,
            sheetName: name,
            headers,
            rows,
            rowCount: rows.length,
            colFormats: {},
          }
        })

        resolve({ name: file.name, sheets })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

const ACCEPT = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  '.xlsx', '.xls', '.csv',
]

export function ExcelViewerPage() {
  const [loading, setLoading] = useState(false)
  const [excelFile, setExcelFile] = useState<ExcelFile | null>(null)
  const [activeSheet, setActiveSheet] = useState<string | null>(null)

  const handleDrop = async (files: File[]) => {
    setLoading(true)
    try {
      const result = await readExcel(files[0])
      setExcelFile(result)
      setActiveSheet(result.sheets[0]?.sheetName ?? null)
    } catch {
      notifications.show({ title: 'Read failed', message: 'Could not read the file', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => { setExcelFile(null); setActiveSheet(null) }

  const handleFormatChange = (sheetName: string, colIndex: number, fmt: ColFormatType) => {
    setExcelFile((prev) =>
      prev
        ? {
            ...prev,
            sheets: prev.sheets.map((s) =>
              s.sheetName === sheetName
                ? { ...s, colFormats: { ...s.colFormats, [colIndex]: fmt } }
                : s,
            ),
          }
        : null,
    )
  }

  const currentSheet = excelFile?.sheets.find((s) => s.sheetName === activeSheet)

  return (
    <Paper shadow="xs" radius="md" p="xl" className={styles.container}>
      <Stack gap="lg">

        {/* Title */}
        <div>
          <Text className={styles.pageTitle}>Excel Viewer</Text>
          <Text className={styles.pageSubtitle}>
            Quick preview of .xlsx / .xls / .csv files directly in the browser
          </Text>
        </div>

        {/* Dropzone — always visible, compact when file loaded */}
        {!excelFile && (
          <Dropzone
            onDrop={handleDrop}
            accept={ACCEPT}
            maxFiles={1}
            loading={loading}
            className={styles.dropzone}
            p={0}
          >
            <div className={styles.dropzoneInner}>
              <Dropzone.Accept><IconUpload size={40} color="#74c0fc" /></Dropzone.Accept>
              <Dropzone.Reject><IconX size={40} color="#f03e3e" /></Dropzone.Reject>
              <Dropzone.Idle><IconFileSpreadsheet size={40} color="#adb5bd" /></Dropzone.Idle>
              <Text size="sm" c="dimmed">
                Drag file here or{' '}
                <Text span c="blue" style={{ cursor: 'pointer' }}>click to browse</Text>
              </Text>
              <Text size="xs" c="dimmed">Supports .xlsx · .xls · .csv</Text>
            </div>
          </Dropzone>
        )}

        {/* File loaded */}
        {excelFile && (
          <>
            {/* Info bar */}
            <Group justify="space-between" align="center" className={styles.infoBar}>
              <Group gap="xs">
                <IconFileSpreadsheet size={18} color="#2f9e44" />
                <Text size="sm" fw={500}>{excelFile.name}</Text>
                <Badge variant="light" color="green" size="sm">
                  {excelFile.sheets.length} sheet{excelFile.sheets.length > 1 ? 's' : ''}
                </Badge>
                {currentSheet && (
                  <>
                    <Badge variant="light" color="blue" size="sm">
                      {currentSheet.rowCount.toLocaleString()} rows
                    </Badge>
                    <Badge variant="light" color="teal" size="sm">
                      {currentSheet.headers.length} columns
                    </Badge>
                  </>
                )}
              </Group>

              <Group gap="xs">
                <Dropzone
                  onDrop={handleDrop}
                  accept={ACCEPT}
                  maxFiles={1}
                  loading={loading}
                  className={styles.dropzoneCompact}
                  p={0}
                >
                  <Text size="xs" c="blue" px="sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Open another file
                  </Text>
                </Dropzone>

                <Tooltip label="Close file">
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={handleClear}>
                    <IconX size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            {/* Sheet tabs + table */}
            {excelFile.sheets.length === 1 ? (
              <PreviewTable
                file={excelFile.sheets[0]}
                onFormatChange={(ci, fmt) => handleFormatChange(excelFile.sheets[0].sheetName, ci, fmt)}
              />
            ) : (
              <Tabs value={activeSheet} onChange={setActiveSheet}>
                <Tabs.List mb="sm">
                  {excelFile.sheets.map((s) => (
                    <Tabs.Tab key={s.sheetName} value={s.sheetName}>
                      {s.sheetName}
                      <Badge variant="light" color="gray" size="xs" ml={6}>
                        {s.rowCount.toLocaleString()}
                      </Badge>
                    </Tabs.Tab>
                  ))}
                </Tabs.List>

                {excelFile.sheets.map((s) => (
                  <Tabs.Panel key={s.sheetName} value={s.sheetName}>
                    <PreviewTable
                      file={s}
                      onFormatChange={(ci, fmt) => handleFormatChange(s.sheetName, ci, fmt)}
                    />
                  </Tabs.Panel>
                ))}
              </Tabs>
            )}
          </>
        )}

      </Stack>
    </Paper>
  )
}
