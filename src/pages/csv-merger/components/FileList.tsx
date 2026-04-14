import { useRef, useState } from 'react'
import { ActionIcon, Badge, Group, Modal, Table, Text, TextInput, Tooltip } from '@mantine/core'
import { IconEye, IconGripVertical, IconTable, IconTrash } from '@tabler/icons-react'
import type { CsvFile, ColFormatType } from '../types'
import { PreviewTable } from './PreviewTable'
import styles from '../csv-merger.module.scss'

interface Props {
  files: CsvFile[]
  onChange: (files: CsvFile[]) => void
}

export function FileList({ files, onChange }: Props) {
  const [previewFile, setPreviewFile] = useState<CsvFile | null>(null)
  const dragIndex = useRef<number | null>(null)

  const handleSheetNameChange = (id: string, value: string) => {
    onChange(files.map((f) => (f.id === id ? { ...f, sheetName: value } : f)))
  }

  const handleDelete = (id: string) => {
    onChange(files.filter((f) => f.id !== id))
  }

  const handleDragStart = (index: number) => {
    dragIndex.current = index
  }

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current
    if (from === null || from === targetIndex) return
    const next = [...files]
    const [moved] = next.splice(from, 1)
    next.splice(targetIndex, 0, moved)
    onChange(next)
    dragIndex.current = null
  }

  const handleFormatChange = (colIndex: number, fmt: ColFormatType) => {
    if (!previewFile) return
    const updated = { ...previewFile, colFormats: { ...previewFile.colFormats, [colIndex]: fmt } }
    setPreviewFile(updated)
    onChange(files.map((f) => (f.id === updated.id ? updated : f)))
  }

  return (
    <>
      <Table withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={36} />
            <Table.Th>File</Table.Th>
            <Table.Th w={180}>Sheet name</Table.Th>
            <Table.Th w={90}>Rows</Table.Th>
            <Table.Th w={90}>Columns</Table.Th>
            <Table.Th w={70} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {files.map((file, index) => (
            <Table.Tr
              key={file.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={styles.fileRow}
            >
              <Table.Td>
                <IconGripVertical size={16} color="#adb5bd" className={styles.dragHandle} />
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <IconTable size={15} color="#74c0fc" />
                  <span style={{ fontSize: 13 }}>{file.name}</span>
                </Group>
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="xs"
                  value={file.sheetName}
                  maxLength={31}
                  onChange={(e) => handleSheetNameChange(file.id, e.currentTarget.value)}
                />
              </Table.Td>
              <Table.Td>
                <Badge variant="light" color="blue" size="sm">
                  {file.rowCount.toLocaleString()}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge variant="light" color="teal" size="sm">
                  {file.headers.length}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <Tooltip label="Preview & format columns">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      size="sm"
                      onClick={() => setPreviewFile(file)}
                    >
                      <IconEye size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Remove">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        title={
          <div>
            <Text fw={600} size="sm">{previewFile?.name}</Text>
            <Text size="xs" c="dimmed" mt={2}>Select column format in the purple row below the headers</Text>
          </div>
        }
        size="70%"
      >
        {previewFile && (
          <PreviewTable
            file={previewFile}
            onFormatChange={handleFormatChange}
          />
        )}
      </Modal>
    </>
  )
}
