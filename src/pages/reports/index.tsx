import { Badge, Button, Group, Pagination, Select, Stack, Text } from '@mantine/core'
import {
  IconCalendar,
  IconCategory,
  IconCurrencyDong,
  IconDotsVertical,
  IconDownload,
  IconFilter,
  IconTableExport,
} from '@tabler/icons-react'
import { Menu, ActionIcon } from '@mantine/core'
import { DataTable, type TableColumn } from '@/components/data-table'
import styles from './reports.module.scss'

interface Transaction {
  id: string
  date: string
  time: string
  description: string
  category: string
  categoryColor: string
  amount: number
  status: string
  statusColor: string
}

const TRANSACTIONS: Transaction[] = [
  {
    id: '#VIB-982310',
    date: '15/10/2023',
    time: '14:30:22',
    description: 'Thanh toán tiền điện tháng 10',
    category: 'Hóa đơn',
    categoryColor: 'orange',
    amount: -1250000,
    status: 'Thành công',
    statusColor: 'green',
  },
  {
    id: '#VIB-774211',
    date: '14/10/2023',
    time: '09:12:05',
    description: 'Chuyển khoản đến NGUYEN ...',
    category: 'Chuyển tiền',
    categoryColor: 'blue',
    amount: -5000000,
    status: 'Đang xử lý',
    statusColor: 'yellow',
  },
  {
    id: '#VIB-552388',
    date: '13/10/2023',
    time: '20:45:00',
    description: 'Nhận lương tháng 09',
    category: 'Nạp tiền',
    categoryColor: 'teal',
    amount: 22000000,
    status: 'Thành công',
    statusColor: 'green',
  },
  {
    id: '#VIB-441209',
    date: '12/10/2023',
    time: '11:15:30',
    description: 'Nạp tiền điện thoại',
    category: 'Thanh toán',
    categoryColor: 'cyan',
    amount: -200000,
    status: 'Thất bại',
    statusColor: 'red',
  },
  {
    id: '#VIB-330154',
    date: '11/10/2023',
    time: '08:22:10',
    description: 'Thanh toán internet tháng 10',
    category: 'Hóa đơn',
    categoryColor: 'orange',
    amount: -350000,
    status: 'Thành công',
    statusColor: 'green',
  },
  {
    id: '#VIB-221087',
    date: '10/10/2023',
    time: '16:05:44',
    description: 'Chuyển tiền cho TRAN THI B',
    category: 'Chuyển tiền',
    categoryColor: 'blue',
    amount: -2000000,
    status: 'Thành công',
    statusColor: 'green',
  },
  {
    id: '#VIB-119023',
    date: '09/10/2023',
    time: '11:50:33',
    description: 'Nhận tiền hoàn ứng',
    category: 'Nạp tiền',
    categoryColor: 'teal',
    amount: 500000,
    status: 'Thành công',
    statusColor: 'green',
  },
]

function formatAmount(amount: number) {
  const abs = Math.abs(amount).toLocaleString('vi-VN')
  return amount >= 0 ? `+${abs}đ` : `-${abs}đ`
}

const COLUMNS: TableColumn<Transaction>[] = [
  {
    key: 'date',
    title: 'Ngày/Giờ',
    width: 120,
    sortable: true,
    sortValue: (row) => row.date,
    render: (row) => (
      <>
        <Text size="sm" fw={500}>{row.date}</Text>
        <Text size="xs" c="dimmed">{row.time}</Text>
      </>
    ),
  },
  {
    key: 'id',
    title: 'Mã giao dịch',
    width: 140,
    sortable: true,
    sortValue: (row) => row.id,
    render: (row) => (
      <Text size="sm" c="dimmed" ff="monospace">{row.id}</Text>
    ),
  },
  {
    key: 'description',
    title: 'Nội dung',
    minWidth: 200,
    sortable: true,
    sortValue: (row) => row.description,
    render: (row) => <Text size="sm">{row.description}</Text>,
  },
  {
    key: 'category',
    title: 'Hạng mục',
    width: 130,
    sortable: true,
    sortValue: (row) => row.category,
    render: (row) => (
      <Badge color={row.categoryColor} variant="light" size="sm" radius="sm">
        {row.category}
      </Badge>
    ),
  },
  {
    key: 'amount',
    title: 'Số tiền',
    width: 140,
    align: 'right',
    sortable: true,
    sortValue: (row) => row.amount,
    render: (row) => (
      <Text size="sm" fw={600} c={row.amount >= 0 ? 'teal' : 'red'}>
        {formatAmount(row.amount)}
      </Text>
    ),
  },
  {
    key: 'status',
    title: 'Trạng thái',
    width: 140,
    sortable: true,
    sortValue: (row) => row.status,
    render: (row) => (
      <Badge color={row.statusColor} variant="dot" size="sm">
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'actions',
    title: '',
    width: 48,
    render: () => (
      <Menu shadow="sm" width={160} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" size="sm">
            <IconDotsVertical size={15} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>Xem chi tiết</Menu.Item>
          <Menu.Item>Tải biên lai</Menu.Item>
          <Menu.Divider />
          <Menu.Item color="red">Báo cáo lỗi</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    ),
  },
]

export function ReportsPage() {
  return (
    <Stack gap="lg">
      {/* ── Title row ── */}
      <Group justify="space-between" align="flex-start">
        <div>
          <Text className={styles.pageTitle}>Báo cáo Giao dịch</Text>
          <Text className={styles.pageSubtitle}>Quản lý và theo dõi lịch sử tài chính của bạn</Text>
        </div>
        <Group gap="sm">
          <Button
            leftSection={<IconDownload size={15} />}
            size="sm"
            radius="md"
          >
            Xuất PDF
          </Button>
          <Button
            leftSection={<IconTableExport size={15} />}
            size="sm"
            radius="md"
            color="vibOrange"
          >
            Xuất Excel
          </Button>
        </Group>
      </Group>

      {/* ── Filters ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterItem}>
          <Text className={styles.filterLabel}>Khoảng thời gian</Text>
          <Select
            leftSection={<IconCalendar size={14} color="#6b7280" />}
            data={['30 ngày gần nhất', '7 ngày gần nhất', 'Tháng này', 'Quý này', 'Năm này']}
            defaultValue="30 ngày gần nhất"
            radius="md"
            size="sm"
          />
        </div>
        <div className={styles.filterItem}>
          <Text className={styles.filterLabel}>Loại giao dịch</Text>
          <Select
            leftSection={<IconFilter size={14} color="#6b7280" />}
            data={['Tất cả loại', 'Hóa đơn', 'Chuyển tiền', 'Nạp tiền', 'Thanh toán']}
            defaultValue="Tất cả loại"
            radius="md"
            size="sm"
          />
        </div>
        <div className={styles.filterItem}>
          <Text className={styles.filterLabel}>Trạng thái</Text>
          <Select
            leftSection={<IconCategory size={14} color="#6b7280" />}
            data={['Tất cả trạng thái', 'Thành công', 'Đang xử lý', 'Thất bại']}
            defaultValue="Tất cả trạng thái"
            radius="md"
            size="sm"
          />
        </div>
        <div className={styles.filterItem}>
          <Text className={styles.filterLabel}>Khoảng tiền</Text>
          <Select
            leftSection={<IconCurrencyDong size={14} color="#6b7280" />}
            data={['Mọi số tiền', 'Dưới 1 triệu', '1 - 5 triệu', '5 - 20 triệu', 'Trên 20 triệu']}
            defaultValue="Mọi số tiền"
            radius="md"
            size="sm"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={COLUMNS}
        data={TRANSACTIONS}
        keyField="id"
        footer={
          <>
            <Text size="sm" c="dimmed">
              Hiển thị <b>1</b> đến <b>10</b> của <b>152</b> giao dịch
            </Text>
            <Pagination total={16} defaultValue={1} size="sm" radius="md" />
          </>
        }
      />
    </Stack>
  )
}
