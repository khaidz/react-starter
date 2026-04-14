import { useRef, useState } from 'react'
import {
  Alert,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  Radio,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconDownload, IconFileTypeCsv, IconUpload, IconX } from '@tabler/icons-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { CsvFile } from './types'
import { buildWorksheet, sanitizeSheetName } from '@/lib/excel'
import { FileList } from './components/FileList'
import styles from './csv-merger.module.scss'

function uniqueSheetName(name: string, existing: string[]): string {
  if (!existing.includes(name)) return name
  let i = 2
  while (existing.includes(`${name.slice(0, 28)}_${i}`)) i++
  return `${name.slice(0, 28)}_${i}`
}

function parseCsv(file: File): Promise<CsvFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const [headers = [], ...rows] = result.data
        resolve({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          sheetName: '',
          headers,
          rows,
          rowCount: rows.length,
          colFormats: {},
        })
      },
      error: (err) => reject(err),
    })
  })
}

export function CsvMergerPage() {
  const [files, setFiles] = useState<CsvFile[]>([])
  const [mergeMode, setMergeMode] = useState<'sheets' | 'single'>('sheets')
  const [outputName, setOutputName] = useState('merged')
  const [parsing, setParsing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const sheetNamesRef = useRef<string[]>([])

  const handleDrop = async (dropped: File[]) => {
    setParsing(true)
    const newFiles: CsvFile[] = []
    const errors: string[] = []

    for (const file of dropped) {
      try {
        const parsed = await parseCsv(file)
        const baseName = sanitizeSheetName(file.name.replace(/\.csv$/i, ''))
        const sheetName = uniqueSheetName(baseName, [
          ...sheetNamesRef.current,
          ...newFiles.map((f) => f.sheetName),
        ])
        parsed.sheetName = sheetName
        newFiles.push(parsed)
      } catch {
        errors.push(file.name)
      }
    }

    if (errors.length > 0) {
      notifications.show({
        title: 'Parse error',
        message: `Could not parse: ${errors.join(', ')}`,
        color: 'red',
      })
    }

    setFiles((prev) => {
      const next = [...prev, ...newFiles]
      sheetNamesRef.current = next.map((f) => f.sheetName)
      return next
    })
    setParsing(false)
  }

  const handleFilesChange = (updated: CsvFile[]) => {
    sheetNamesRef.current = updated.map((f) => f.sheetName)
    setFiles(updated)
  }

  const handleExport = () => {
    if (files.length === 0) return
    setExporting(true)
    // setTimeout lets the loading state render before the blocking work starts
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new()

        if (mergeMode === 'sheets') {
          files.forEach((f) => {
            const ws = buildWorksheet(f)
            XLSX.utils.book_append_sheet(wb, ws, f.sheetName || f.name)
          })
        } else {
          const first = files[0]
          const allRows = files.flatMap((f) => f.rows)
          const merged: CsvFile = { ...first, rows: allRows, rowCount: allRows.length }
          const ws = buildWorksheet(merged)
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
        }

        XLSX.writeFile(wb, `${outputName || 'merged'}.xlsx`)
        notifications.show({ title: 'Done!', message: `Exported ${outputName || 'merged'}.xlsx`, color: 'green' })
      } catch {
        notifications.show({ title: 'Export failed', message: 'Could not generate Excel file', color: 'red' })
      } finally {
        setExporting(false)
      }
    }, 10)
  }

  const totalRows = files.reduce((s, f) => s + f.rowCount, 0)

  return (
    <Paper shadow="xs" radius="md" p="xl" className={styles.container}>
      <Stack gap="lg">
      <div>
        <Text className={styles.pageTitle}>CSV Merger</Text>
        <Text className={styles.pageSubtitle}>
          Merge multiple CSV files into a single Excel (.xlsx) file
        </Text>
      </div>

      {/* Drop zone */}
      <Dropzone
        onDrop={handleDrop}
        accept={['text/csv', 'application/vnd.ms-excel', '.csv']}
        className={styles.dropzone}
        loading={parsing}
        p={0}
      >
        <div className={styles.dropzoneInner}>
          <Dropzone.Accept>
            <IconUpload size={36} color="#74c0fc" />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={36} color="#f03e3e" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            {parsing
              ? <Loader size="md" />
              : <IconFileTypeCsv size={36} color="#adb5bd" />
            }
          </Dropzone.Idle>
          <Text size="sm" c="dimmed">
            {parsing
              ? 'Parsing files…'
              : <>Drag CSV files here or <Text span c="blue" style={{ cursor: 'pointer' }}>click to browse</Text></>
            }
          </Text>
          {!parsing && <Text size="xs" c="dimmed">Supports multiple files at once</Text>}
        </div>
      </Dropzone>

      {files.length > 0 && (
        <>
          {/* Options */}
          <div className={styles.optionsCard}>
            <Group align="flex-start" gap="xl" wrap="nowrap">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text size="sm" fw={500}>Output filename</Text>
                <TextInput
                  size="xs"
                  value={outputName}
                  onChange={(e) => setOutputName(e.currentTarget.value)}
                  rightSection={<Text size="xs" c="dimmed">.xlsx</Text>}
                  style={{ maxWidth: 220 }}
                />
              </Stack>

              <Divider orientation="vertical" />

              <Stack gap="xs" style={{ flex: 2 }}>
                <Text size="sm" fw={500}>Merge mode</Text>
                <Radio.Group value={mergeMode} onChange={(v) => setMergeMode(v as 'sheets' | 'single')}>
                  <Stack gap="xs">
                    <Radio
                      value="sheets"
                      label="Each CSV → separate sheet"
                      size="sm"
                    />
                    <Radio
                      value="single"
                      label="Merge all into one sheet (uses first file's headers)"
                      size="sm"
                    />
                  </Stack>
                </Radio.Group>
              </Stack>
            </Group>
          </div>

          {/* Warning for single mode with mismatched headers */}
          {mergeMode === 'single' && files.length > 1 && (() => {
            const firstHeaders = JSON.stringify(files[0].headers)
            const mismatch = files.slice(1).some((f) => JSON.stringify(f.headers) !== firstHeaders)
            return mismatch ? (
              <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                Some files have different headers — only the first file's headers will be used as column names.
              </Alert>
            ) : null
          })()}

          {/* File list */}
          <FileList files={files} onChange={handleFilesChange} />

          {/* Export */}
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {files.length} file{files.length > 1 ? 's' : ''} · {totalRows.toLocaleString()} total rows
            </Text>
            <Button
              leftSection={exporting ? <Loader size={14} color="white" /> : <IconDownload size={16} />}
              className={styles.exportBtn}
              disabled={exporting}
              onClick={handleExport}
            >
              {exporting ? 'Exporting…' : 'Export Excel'}
            </Button>
          </Group>
        </>
      )}
      </Stack>
    </Paper>
  )
}
