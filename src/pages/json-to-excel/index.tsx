import { useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconBraces,
  IconDownload,
  IconEye,
  IconSparkles,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import * as XLSX from 'xlsx'
import type { CsvFile, ColFormatType } from '@/pages/csv-merger/types'
import { buildWorksheet } from '@/lib/excel'
import { PreviewTable } from '@/pages/csv-merger/components/PreviewTable'
import styles from './json-to-excel.module.scss'

function flattenObject(obj: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[k] = v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')
  }
  return result
}

function parseJson(text: string): { headers: string[]; rows: string[][] } {
  const parsed = JSON.parse(text)

  let arr: unknown[]
  if (Array.isArray(parsed)) {
    arr = parsed
  } else if (parsed && typeof parsed === 'object') {
    const arrayProp = Object.values(parsed).find(Array.isArray) as unknown[] | undefined
    if (!arrayProp) throw new Error('No array found. Expected an array or an object containing an array.')
    arr = arrayProp
  } else {
    throw new Error('JSON must be an array or an object containing an array.')
  }

  if (arr.length === 0) throw new Error('Array is empty.')

  const keySet = new Set<string>()
  arr.forEach((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item))
      Object.keys(item as object).forEach((k) => keySet.add(k))
  })
  const headers = [...keySet]

  const rows = arr.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      return headers.map(() => String(item ?? ''))
    const flat = flattenObject(item as Record<string, unknown>)
    return headers.map((h) => flat[h] ?? '')
  })

  return { headers, rows }
}

export function JsonToExcelPage() {
  // Uncontrolled textarea — đọc/ghi DOM trực tiếp, không re-render khi gõ
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const getText = () => textareaRef.current?.value ?? ''
  const setText = (val: string) => { if (textareaRef.current) textareaRef.current.value = val }

  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<CsvFile | null>(null)
  const [exporting, setExporting] = useState(false)
  const [outputName, setOutputName] = useState('output')
  const [isDragging, setIsDragging] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetResult = () => { setParsed(null); setParseError(null) }

  const handleFormat = () => {
    const text = getText()
    if (!text.trim()) return
    try {
      setText(JSON.stringify(JSON.parse(text), null, 2))
      setParseError(null)
    } catch {
      setParseError('Invalid JSON — cannot format')
    }
  }

  const handleParse = (rawText?: string) => {
    const text = rawText ?? getText()
    if (!text.trim()) return
    setParseError(null)
    setParsing(true)
    // setTimeout lets the loading state render before the blocking parse work
    setTimeout(() => {
      try {
        const { headers, rows } = parseJson(text)
        setParsed({
          id: `json-${Date.now()}`,
          name: 'data.json',
          sheetName: 'Sheet1',
          headers,
          rows,
          rowCount: rows.length,
          colFormats: {},
        })
      } catch (e) {
        setParseError(e instanceof Error ? e.message : 'Invalid JSON')
        setParsed(null)
      } finally {
        setParsing(false)
      }
    }, 10)
  }

  const readFile = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      notifications.show({ title: 'Invalid file', message: 'Only .json files are supported', color: 'red' })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setText(text)
      resetResult()
      handleParse(text)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  const handleFormatChange = (colIndex: number, fmt: ColFormatType) => {
    if (!parsed) return
    setParsed({ ...parsed, colFormats: { ...parsed.colFormats, [colIndex]: fmt } })
  }

  const handleExport = () => {
    if (!parsed) return
    setExporting(true)
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, buildWorksheet(parsed), parsed.sheetName || 'Sheet1')
        XLSX.writeFile(wb, `${outputName || 'output'}.xlsx`)
        notifications.show({ title: 'Done!', message: `Exported ${outputName}.xlsx`, color: 'green' })
      } catch {
        notifications.show({ title: 'Export failed', message: 'Could not generate Excel file', color: 'red' })
      } finally {
        setExporting(false)
      }
    }, 10)
  }

  return (
    <Paper shadow="xs" radius="md" p="xl" className={styles.container}>
      <Stack gap="lg">

        <div>
          <Text className={styles.pageTitle}>JSON to Excel</Text>
          <Text className={styles.pageSubtitle}>
            Convert a JSON array to an Excel (.xlsx) file with optional column formatting
          </Text>
        </div>

        {/* Editor */}
        <div
          className={`${styles.editorWrapper} ${isDragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={styles.toolbar}>
            <Group gap="xs">
              <Tooltip label="Upload .json file">
                <Button size="xs" variant="light" color="blue"
                  leftSection={<IconUpload size={13} />}
                  onClick={() => fileInputRef.current?.click()}
                >Upload</Button>
              </Tooltip>

              <Tooltip label="Pretty-print JSON">
                <Button size="xs" variant="light" color="violet"
                  leftSection={<IconSparkles size={13} />}
                  onClick={handleFormat}
                >Format</Button>
              </Tooltip>

              <Tooltip label="Clear editor">
                <Button size="xs" variant="subtle" color="gray"
                  leftSection={<IconTrash size={13} />}
                  onClick={() => { setText(''); resetResult() }}
                >Clear</Button>
              </Tooltip>
            </Group>

            <Button size="xs" leftSection={parsing ? <Loader size={12} color="white" /> : <IconBraces size={13} />}
              disabled={parsing}
              onClick={() => handleParse()}
            >
              {parsing ? 'Parsing…' : 'Parse'}
            </Button>
          </div>

          {/* Uncontrolled textarea — no re-render on keystroke */}
          <Textarea
            ref={textareaRef}
            placeholder={'[\n  { "name": "Alice", "score": 95 },\n  { "name": "Bob",   "score": 82 }\n]'}
            defaultValue=""
            onChange={resetResult}
            autosize
            minRows={10}
            maxRows={20}
            className={styles.editor}
            styles={{
              input: { fontFamily: 'monospace', fontSize: 12, border: 'none', borderRadius: 0, background: 'transparent' },
            }}
          />

          {isDragging && (
            <div className={styles.dropOverlay}>
              <IconUpload size={32} color="#74c0fc" />
              <Text size="sm" c="blue">Drop .json file here</Text>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={handleFileInput} />

        {parseError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" py="xs">
            {parseError}
          </Alert>
        )}

        {parsed && (
          <Group justify="space-between" align="center" className={styles.resultBar}>
            <Group gap="xs">
              <Badge variant="light" color="blue" size="sm">{parsed.rowCount.toLocaleString()} rows</Badge>
              <Badge variant="light" color="teal" size="sm">{parsed.headers.length} columns</Badge>
              <Button size="xs" variant="subtle" color="blue"
                leftSection={<IconEye size={13} />}
                onClick={() => setPreviewOpen(true)}
              >
                Preview & format columns
              </Button>
            </Group>

            <Group gap="xs" align="flex-end">
              <TextInput size="xs" value={outputName}
                onChange={(e) => setOutputName(e.currentTarget.value)}
                rightSection={<Text size="xs" c="dimmed">.xlsx</Text>}
                style={{ width: 180 }}
              />
              <Button leftSection={exporting ? <Loader size={14} color="white" /> : <IconDownload size={15} />}
                className={styles.exportBtn}
                disabled={exporting}
                onClick={handleExport}
              >
                {exporting ? 'Exporting…' : 'Export Excel'}
              </Button>
            </Group>
          </Group>
        )}

        <Modal
          opened={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={
            <div>
              <Text fw={600} size="sm">Preview — data.json</Text>
              <Text size="xs" c="dimmed" mt={2}>Select column format in the purple row below the headers</Text>
            </div>
          }
          size="70%"
        >
          {parsed && <PreviewTable file={parsed} onFormatChange={handleFormatChange} />}
        </Modal>

      </Stack>
    </Paper>
  )
}
