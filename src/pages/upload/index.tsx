import { useRef, useState } from 'react'
import { Button, Progress } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import {
  IconCloudUpload,
  IconFile,
  IconFolder,
  IconInfoCircle, IconX
} from '@tabler/icons-react'
import styles from './upload.module.scss'

interface UploadFile {
  id: string
  name: string
  progress: number
  done: boolean
}

const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
]

export function UploadPage() {
  const openRef = useRef<() => void>(null)
  const [files, setFiles] = useState<UploadFile[]>([
    { id: '1', name: 'Q4_Financial_Audit_Report_2023.pdf', progress: 85, done: false },
  ])
  const [, setShowSuccess] = useState(true)

  const handleDrop = (dropped: File[]) => {
    dropped.forEach((file) => {
      const id = crypto.randomUUID()
      setFiles((prev) => [...prev, { id, name: file.name, progress: 0, done: false }])

      // Simulate upload progress
      let pct = 0
      const interval = setInterval(() => {
        pct += Math.floor(Math.random() * 15) + 5
        if (pct >= 100) {
          pct = 100
          clearInterval(interval)
          setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 100, done: true } : f)))
          setShowSuccess(true)
        } else {
          setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: pct } : f)))
        }
      }, 400)
    })
  }

  return (
    <div className={styles.page}>
      {/* Page title */}
      <h1 className={styles.pageTitle}>Central Repository Upload</h1>
      <p className={styles.pageSubtitle}>
        Upload and secure your internal bank documents.
        <br />
        Files are automatically encrypted upon submission.
      </p>

      {/* Dropzone */}
      <Dropzone
        openRef={openRef}
        onDrop={handleDrop}
        accept={ACCEPTED_MIME}
        maxSize={25 * 1024 * 1024}
        radius="lg"
        styles={{ root: { padding: 0, border: 'none', background: 'transparent' } }}
      >
        <Dropzone.Accept>
          <div className={`${styles.dropzoneWrapper} ${styles.active}`}>
            <div className={styles.dropzoneIcon}>
              <IconCloudUpload size={28} color="#f5821f" />
            </div>
            <div className={styles.dropzoneTitle}>Drop files here</div>
          </div>
        </Dropzone.Accept>
        <Dropzone.Reject>
          <div className={`${styles.dropzoneWrapper} ${styles.active}`}>
            <div className={styles.dropzoneIcon}>
              <IconX size={28} color="#dc2626" />
            </div>
            <div className={styles.dropzoneTitle}>File not supported</div>
          </div>
        </Dropzone.Reject>
        <Dropzone.Idle>
          <div className={styles.dropzoneWrapper}>
            <div className={styles.dropzoneIcon}>
              <IconCloudUpload size={28} color="#f5821f" />
            </div>
            <div className={styles.dropzoneTitle}>Drag and drop your files here</div>
            <div className={styles.dropzoneHint}>
              Supported formats: PDF, DOCX, XLSX, JPG (Max 25MB)
            </div>
            <div className={styles.dropzoneDivider}>OR</div>
            <Button
              className={styles.browseBtn}
              leftSection={<IconFolder size={16} />}
              onClick={() => openRef.current?.()}
            >
              Browse Files
            </Button>
          </div>
        </Dropzone.Idle>
      </Dropzone>

      {/* File list */}
      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((f) => (
            <div key={f.id} className={styles.fileItem}>
              <div className={styles.fileRow}>
                <div className={styles.fileIcon}>
                  <IconFile size={18} color="#2563eb" />
                </div>
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.filePct}>{f.progress}%</span>
              </div>
              <Progress
                value={f.progress}
                color={f.done ? 'green' : '#f5821f'}
                size="sm"
                radius="xl"
              />
              {!f.done && (
                <div className={styles.fileStatus}>
                  <IconInfoCircle size={12} />
                  Encrypting and scanning for threats...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
