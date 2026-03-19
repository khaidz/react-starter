import { useState } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Divider,
  Progress,
  Select,
  Text,
  Tooltip,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import {
  IconCheck,
  IconChevronDown,
  IconCircleCheck,
  IconClock,
  IconDownload,
  IconFile,
  IconFileSpreadsheet,
  IconFileText,
  IconFileTypeCsv,
  IconFileTypePdf,
  IconLoader,
  IconTableExport,
  IconX,
} from '@tabler/icons-react'
import styles from './export.module.scss'

// ─── Types ────────────────────────────────────────────
type Format = 'xlsx' | 'csv' | 'pdf'
type Status = 'success' | 'processing' | 'failed'

interface ExportJob {
  id: string
  dataType: string
  dateRange: string
  format: Format
  rows: number
  exportedAt: string
  status: Status
  size: string
}

// ─── Config ───────────────────────────────────────────
const DATA_TYPES = [
  {
    value: 'transactions',
    label: 'Lịch sử giao dịch',
    desc: 'Toàn bộ lịch sử giao dịch theo tài khoản',
    icon: IconTableExport,
    color: '#004b8d',
    bg: '#eff6ff',
  },
  {
    value: 'statement',
    label: 'Sao kê tài khoản',
    desc: 'Sao kê chi tiết số dư và phát sinh',
    icon: IconFileText,
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    value: 'income',
    label: 'Báo cáo thu chi',
    desc: 'Tổng hợp thu nhập và chi tiêu theo kỳ',
    icon: IconFileSpreadsheet,
    color: '#059669',
    bg: '#f0fdf4',
  },
  {
    value: 'loans',
    label: 'Lịch sử vay vốn',
    desc: 'Danh sách các khoản vay và lịch trả nợ',
    icon: IconFile,
    color: '#f37021',
    bg: '#fff7ed',
  },
]

const COLUMNS: Record<string, { key: string; label: string }[]> = {
  transactions: [
    { key: 'date',        label: 'Ngày giao dịch' },
    { key: 'desc',        label: 'Mô tả' },
    { key: 'amount',      label: 'Số tiền' },
    { key: 'type',        label: 'Loại giao dịch' },
    { key: 'balance',     label: 'Số dư sau GD' },
    { key: 'ref',         label: 'Mã tham chiếu' },
    { key: 'account',     label: 'Tài khoản' },
    { key: 'category',    label: 'Danh mục' },
  ],
  statement: [
    { key: 'date',        label: 'Ngày' },
    { key: 'opening',     label: 'Số dư đầu kỳ' },
    { key: 'credit',      label: 'Phát sinh có' },
    { key: 'debit',       label: 'Phát sinh nợ' },
    { key: 'closing',     label: 'Số dư cuối kỳ' },
    { key: 'desc',        label: 'Diễn giải' },
  ],
  income: [
    { key: 'period',      label: 'Kỳ' },
    { key: 'income',      label: 'Tổng thu' },
    { key: 'expense',     label: 'Tổng chi' },
    { key: 'net',         label: 'Chênh lệch' },
    { key: 'category',    label: 'Danh mục' },
    { key: 'note',        label: 'Ghi chú' },
  ],
  loans: [
    { key: 'loanId',      label: 'Mã khoản vay' },
    { key: 'amount',      label: 'Số tiền vay' },
    { key: 'disbursed',   label: 'Ngày giải ngân' },
    { key: 'due',         label: 'Ngày đáo hạn' },
    { key: 'rate',        label: 'Lãi suất' },
    { key: 'remaining',   label: 'Dư nợ còn lại' },
    { key: 'status',      label: 'Trạng thái' },
  ],
}

const FORMAT_OPTIONS: { value: Format; label: string; ext: string; Icon: React.FC<{ size?: number }> }[] = [
  { value: 'xlsx', label: 'Excel',  ext: '.xlsx', Icon: IconFileSpreadsheet },
  { value: 'csv',  label: 'CSV',    ext: '.csv',  Icon: IconFileTypeCsv },
  { value: 'pdf',  label: 'PDF',    ext: '.pdf',  Icon: IconFileTypePdf },
]

const MOCK_HISTORY: ExportJob[] = [
  { id: 'EXP-001', dataType: 'Lịch sử giao dịch', dateRange: '01/01/2024 – 31/01/2024', format: 'xlsx', rows: 248,  exportedAt: '15/03/2024 09:32', status: 'success',    size: '142 KB' },
  { id: 'EXP-002', dataType: 'Sao kê tài khoản',   dateRange: '01/02/2024 – 29/02/2024', format: 'pdf',  rows: 96,   exportedAt: '14/03/2024 14:10', status: 'success',    size: '320 KB' },
  { id: 'EXP-003', dataType: 'Báo cáo thu chi',     dateRange: '01/01/2024 – 29/02/2024', format: 'csv',  rows: 512,  exportedAt: '10/03/2024 08:45', status: 'success',    size: '88 KB'  },
  { id: 'EXP-004', dataType: 'Lịch sử vay vốn',     dateRange: '01/06/2023 – 31/12/2023', format: 'xlsx', rows: 36,   exportedAt: '05/03/2024 11:20', status: 'failed',     size: '—'      },
  { id: 'EXP-005', dataType: 'Lịch sử giao dịch',  dateRange: '01/12/2023 – 31/12/2023', format: 'csv',  rows: 189,  exportedAt: '01/03/2024 16:05', status: 'success',    size: '64 KB'  },
]

const FORMAT_ICON_COLOR: Record<Format, string> = {
  xlsx: '#059669',
  csv:  '#0891b2',
  pdf:  '#dc2626',
}

// ─── Page ─────────────────────────────────────────────
export function ExportPage() {
  const [dataType, setDataType]   = useState('transactions')
  const [fromDate, setFromDate]   = useState<Date | null>(null)
  const [toDate, setToDate]       = useState<Date | null>(null)
  const [format, setFormat]       = useState<Format>('xlsx')
  const [account, setAccount]     = useState<string | null>('all')
  const [selectedCols, setSelectedCols] = useState<string[]>(
    COLUMNS['transactions'].map((c) => c.key)
  )
  const [exporting, setExporting]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [history, setHistory]       = useState<ExportJob[]>(MOCK_HISTORY)

  const columns = COLUMNS[dataType] ?? []

  const toggleCol = (key: string) =>
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  const handleDataTypeChange = (value: string) => {
    setDataType(value)
    setSelectedCols(COLUMNS[value]?.map((c) => c.key) ?? [])
  }

  const handleExport = () => {
    if (!fromDate || !toDate) {
      notifications.show({
        color: 'red',
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn khoảng thời gian cần xuất dữ liệu.',
      })
      return
    }
    if (selectedCols.length === 0) {
      notifications.show({
        color: 'red',
        title: 'Chưa chọn cột',
        message: 'Vui lòng chọn ít nhất một cột để xuất.',
      })
      return
    }

    setExporting(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + Math.floor(Math.random() * 18) + 5
      })
    }, 280)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)

      setTimeout(() => {
        setExporting(false)
        setProgress(0)

        const dataTypeLabel = DATA_TYPES.find((d) => d.value === dataType)?.label ?? dataType
        const fmt = (d: Date) =>
          d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

        const newJob: ExportJob = {
          id: `EXP-${String(history.length + 1).padStart(3, '0')}`,
          dataType: dataTypeLabel,
          dateRange: `${fmt(fromDate)} – ${fmt(toDate)}`,
          format,
          rows: Math.floor(Math.random() * 400) + 50,
          exportedAt: new Date().toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }),
          status: 'success',
          size: `${Math.floor(Math.random() * 300) + 50} KB`,
        }

        setHistory((prev) => [newJob, ...prev])

        notifications.show({
          color: 'green',
          icon: <IconCircleCheck size={18} />,
          title: 'Xuất dữ liệu thành công',
          message: `${newJob.rows} bản ghi đã được xuất ra file ${format.toUpperCase()}.`,
          autoClose: 4000,
        })
      }, 400)
    }, 2200)
  }

  const selectedType = DATA_TYPES.find((d) => d.value === dataType)

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <Text className={styles.pageTitle}>Xuất Dữ Liệu</Text>
          <Text className={styles.pageSubtitle}>Chọn loại dữ liệu, khoảng thời gian và định dạng file để xuất</Text>
        </div>
      </div>

      <div className={styles.layout}>

        {/* ── Left: Config ── */}
        <div className={styles.configCol}>

          {/* Data type */}
          <section className={styles.section}>
            <Text className={styles.sectionTitle}>Loại dữ liệu</Text>
            <div className={styles.typeGrid}>
              {DATA_TYPES.map(({ value, label, desc, icon: Icon, color, bg }) => (
                <button
                  key={value}
                  className={`${styles.typeCard} ${dataType === value ? styles.typeCardActive : ''}`}
                  onClick={() => handleDataTypeChange(value)}
                  style={dataType === value ? { borderColor: color, background: bg } : undefined}
                >
                  <div className={styles.typeIcon} style={{ background: bg }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div className={styles.typeText}>
                    <span className={styles.typeLabel} style={dataType === value ? { color } : undefined}>
                      {label}
                    </span>
                    <span className={styles.typeDesc}>{desc}</span>
                  </div>
                  {dataType === value && (
                    <IconCheck size={16} className={styles.typeCheck} style={{ color }} />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Date range */}
          <section className={styles.section}>
            <Text className={styles.sectionTitle}>Khoảng thời gian</Text>
            <div className={styles.dateRow}>
              <div className={styles.dateField}>
                <Text className={styles.fieldLabel}>Từ ngày <span className={styles.req}>*</span></Text>
                <DatePickerInput
                  placeholder="DD/MM/YYYY"
                  valueFormat="DD/MM/YYYY"
                  value={fromDate}
                  onChange={setFromDate}
                  maxDate={toDate ?? new Date()}
                  radius="md"
                  leftSection={<IconClock size={15} color="#9ca3af" />}
                  clearable
                />
              </div>
              <div className={styles.dateSep}>→</div>
              <div className={styles.dateField}>
                <Text className={styles.fieldLabel}>Đến ngày <span className={styles.req}>*</span></Text>
                <DatePickerInput
                  placeholder="DD/MM/YYYY"
                  valueFormat="DD/MM/YYYY"
                  value={toDate}
                  onChange={setToDate}
                  minDate={fromDate ?? undefined}
                  maxDate={new Date()}
                  radius="md"
                  leftSection={<IconClock size={15} color="#9ca3af" />}
                  clearable
                />
              </div>
            </div>
            <div className={styles.quickRanges}>
              {[
                { label: '7 ngày', days: 7 },
                { label: '30 ngày', days: 30 },
                { label: '3 tháng', days: 90 },
                { label: '6 tháng', days: 180 },
                { label: 'Năm nay', days: 0 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  className={styles.quickBtn}
                  onClick={() => {
                    const end = new Date()
                    const start = new Date()
                    if (days === 0) {
                      start.setMonth(0); start.setDate(1)
                    } else {
                      start.setDate(start.getDate() - days)
                    }
                    setFromDate(start)
                    setToDate(end)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Account filter */}
          <section className={styles.section}>
            <Text className={styles.sectionTitle}>Tài khoản</Text>
            <Select
              value={account}
              onChange={setAccount}
              data={[
                { value: 'all',    label: 'Tất cả tài khoản' },
                { value: '001',    label: '9704 **** **** 1234 — Thanh toán' },
                { value: '002',    label: '9704 **** **** 5678 — Tiết kiệm' },
                { value: '003',    label: '9704 **** **** 9012 — Đầu tư' },
              ]}
              radius="md"
              rightSection={<IconChevronDown size={14} />}
            />
          </section>

          {/* Columns selection */}
          <section className={styles.section}>
            <div className={styles.colsHeader}>
              <Text className={styles.sectionTitle}>Cột dữ liệu</Text>
              <div className={styles.colsActions}>
                <button
                  className={styles.colsAction}
                  onClick={() => setSelectedCols(columns.map((c) => c.key))}
                >
                  Chọn tất cả
                </button>
                <span className={styles.colsDot}>·</span>
                <button
                  className={styles.colsAction}
                  onClick={() => setSelectedCols([])}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
            <div className={styles.colsGrid}>
              {columns.map(({ key, label }) => (
                <Checkbox
                  key={key}
                  checked={selectedCols.includes(key)}
                  onChange={() => toggleCol(key)}
                  label={label}
                  color="vibOrange"
                  radius="sm"
                  size="sm"
                />
              ))}
            </div>
          </section>

          {/* Format */}
          <section className={styles.section}>
            <Text className={styles.sectionTitle}>Định dạng file</Text>
            <div className={styles.formatRow}>
              {FORMAT_OPTIONS.map(({ value, label, ext, Icon }) => (
                <button
                  key={value}
                  className={`${styles.formatCard} ${format === value ? styles.formatActive : ''}`}
                  onClick={() => setFormat(value)}
                  style={format === value ? { borderColor: FORMAT_ICON_COLOR[value] } : undefined}
                >
                  <Icon size={28} color={FORMAT_ICON_COLOR[value]} />
                  <span className={styles.formatLabel}>{label}</span>
                  <span className={styles.formatExt}>{ext}</span>
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* ── Right: Summary + Action ── */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <Text className={styles.sectionTitle}>Tổng kết xuất dữ liệu</Text>
            <Divider color="#f1f5f9" my="sm" />

            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Loại dữ liệu</span>
                <span className={styles.summaryVal}>
                  {selectedType && (
                    <span style={{ color: selectedType.color, fontWeight: 700 }}>
                      {selectedType.label}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Từ ngày</span>
                <span className={styles.summaryVal}>
                  {fromDate
                    ? fromDate.toLocaleDateString('vi-VN')
                    : <span className={styles.summaryEmpty}>Chưa chọn</span>}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Đến ngày</span>
                <span className={styles.summaryVal}>
                  {toDate
                    ? toDate.toLocaleDateString('vi-VN')
                    : <span className={styles.summaryEmpty}>Chưa chọn</span>}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Định dạng</span>
                <span className={styles.summaryVal} style={{ color: FORMAT_ICON_COLOR[format], fontWeight: 700 }}>
                  {format.toUpperCase()}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Số cột</span>
                <span className={styles.summaryVal}>{selectedCols.length} / {columns.length} cột</span>
              </div>
            </div>

            {/* Export progress */}
            {exporting && (
              <div className={styles.progressWrap}>
                <div className={styles.progressLabel}>
                  <IconLoader size={14} className={styles.spinIcon} />
                  <span>Đang xử lý dữ liệu...</span>
                  <span className={styles.progressPct}>{Math.min(progress, 100)}%</span>
                </div>
                <Progress
                  value={Math.min(progress, 100)}
                  color="vibOrange"
                  radius="xl"
                  size="sm"
                  animated
                />
              </div>
            )}

            <Button
              fullWidth
              radius="md"
              color="vibOrange"
              size="md"
              mt="md"
              leftSection={exporting ? <IconLoader size={16} className={styles.spinIcon} /> : <IconDownload size={16} />}
              loading={exporting}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Đang xuất dữ liệu...' : 'Xuất dữ liệu'}
            </Button>

            <Text size="xs" c="dimmed" ta="center" mt="xs">
              File sẽ được tải về tự động sau khi xử lý xong
            </Text>
          </div>
        </div>
      </div>

      {/* ── Export history ── */}
      <section className={styles.section} style={{ marginTop: '0.5rem' }}>
        <Text className={styles.sectionTitle}>Lịch sử xuất dữ liệu</Text>
        <Divider color="#f1f5f9" my="xs" />

        <div className={styles.historyTable}>
          <div className={styles.historyHead}>
            <span>Mã</span>
            <span>Loại dữ liệu</span>
            <span>Khoảng thời gian</span>
            <span>Định dạng</span>
            <span>Số bản ghi</span>
            <span>Thời gian xuất</span>
            <span>Trạng thái</span>
            <span></span>
          </div>

          {history.map((job) => (
            <div key={job.id} className={styles.historyRow}>
              <span className={styles.jobId}>{job.id}</span>
              <span className={styles.jobType}>{job.dataType}</span>
              <span className={styles.jobRange}>{job.dateRange}</span>
              <span>
                <span
                  className={styles.fmtBadge}
                  style={{ color: FORMAT_ICON_COLOR[job.format], background: `${FORMAT_ICON_COLOR[job.format]}18` }}
                >
                  {job.format.toUpperCase()}
                </span>
              </span>
              <span className={styles.jobRows}>{job.rows.toLocaleString('vi-VN')} dòng</span>
              <span className={styles.jobDate}>{job.exportedAt}</span>
              <span>
                {job.status === 'success' && (
                  <Badge color="green" variant="light" size="sm" radius="sm">Thành công</Badge>
                )}
                {job.status === 'processing' && (
                  <Badge color="blue" variant="light" size="sm" radius="sm">Đang xử lý</Badge>
                )}
                {job.status === 'failed' && (
                  <Badge color="red" variant="light" size="sm" radius="sm">Thất bại</Badge>
                )}
              </span>
              <span>
                {job.status === 'success' ? (
                  <Tooltip label={`Tải về (${job.size})`} position="left">
                    <button className={styles.downloadBtn}>
                      <IconDownload size={15} />
                    </button>
                  </Tooltip>
                ) : (
                  <button className={styles.downloadBtn} disabled>
                    <IconX size={15} />
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
