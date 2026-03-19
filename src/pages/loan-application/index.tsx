import { useState } from 'react'
import {
  ActionIcon,
  Button,
  Checkbox,
  Divider,
  NumberInput,
  Select,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import { useForm } from '@mantine/form'
import {
  IconBriefcase,
  IconCloudUpload,
  IconCurrencyDollar,
  IconDeviceFloppy,
  IconFile,
  IconFileDescription,
  IconFileTypePdf,
  IconNotes,
  IconPaperclip,
  IconPhone,
  IconPlus,
  IconShield,
  IconTrash,
  IconUser,
  IconX,
} from '@tabler/icons-react'
import styles from './loan-application.module.scss'

const ACCEPT_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...IMAGE_MIME_TYPE,
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <IconFileTypePdf size={20} color="#ef4444" />
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? ''))
    return <IconFile size={20} color="#3b82f6" />
  return <IconFile size={20} color="#6b7280" />
}

interface Reference {
  name: string
  relationship: string | null
  phone: string
}

interface Asset {
  assetType: string | null
  value: number | string
  description: string
}

interface FormValues {
  // Personal
  fullName: string
  dob: Date | null
  gender: string | null
  maritalStatus: string | null
  idNumber: string
  issueDate: Date | null
  issuePlace: string
  nationality: string | null
  // Contact
  phone: string
  email: string
  province: string | null
  district: string
  permanentAddress: string
  currentAddress: string
  residentialStatus: string | null
  residentialYears: number | string
  // Employment
  employmentType: string | null
  companyName: string
  position: string
  startDate: Date | null
  monthlyIncome: number | string
  otherIncome: number | string
  workAddress: string
  jobDescription: string
  // Loan
  loanAmount: number | string
  loanTerm: string | null
  loanPurpose: string | null
  repaymentMethod: string | null
  accountNumber: string
  bank: string | null
  loanPurposeDetail: string
  // Additional
  referralChannel: string | null
  referenceCode: string
  notes: string
  agreed: boolean
  confirmed: boolean
  // Dynamic
  references: Reference[]
  assets: Asset[]
}

export function LoanApplicationPage() {
  const form = useForm<FormValues>({
    mode: 'uncontrolled',
    initialValues: {
      fullName: '',
      dob: null,
      gender: null,
      maritalStatus: null,
      idNumber: '',
      issueDate: null,
      issuePlace: '',
      nationality: 'Việt Nam',
      phone: '',
      email: '',
      province: null,
      district: '',
      permanentAddress: '',
      currentAddress: '',
      residentialStatus: null,
      residentialYears: '',
      employmentType: null,
      companyName: '',
      position: '',
      startDate: null,
      monthlyIncome: '',
      otherIncome: '',
      workAddress: '',
      jobDescription: '',
      loanAmount: '',
      loanTerm: null,
      loanPurpose: null,
      repaymentMethod: null,
      accountNumber: '',
      bank: 'VIB',
      loanPurposeDetail: '',
      referralChannel: null,
      referenceCode: '',
      notes: '',
      agreed: false,
      confirmed: false,
      references: [{ name: '', relationship: null, phone: '' }],
      assets: [{ assetType: null, value: '', description: '' }],
    },
    validate: {
      fullName: (v) => v.trim() ? null : 'Vui lòng nhập họ và tên',
      dob: (v) => v ? null : 'Vui lòng chọn ngày sinh',
      gender: (v) => v ? null : 'Vui lòng chọn giới tính',
      idNumber: (v) => v.trim().length >= 9 ? null : 'Số CMND/CCCD không hợp lệ',
      issueDate: (v) => v ? null : 'Vui lòng chọn ngày cấp',
      issuePlace: (v) => v.trim() ? null : 'Vui lòng nhập nơi cấp',
      phone: (v) => /^0\d{9}$/.test(v.replace(/\s/g, '')) ? null : 'Số điện thoại không hợp lệ',
      province: (v) => v ? null : 'Vui lòng chọn tỉnh/thành',
      district: (v) => v.trim() ? null : 'Vui lòng nhập quận/huyện',
      permanentAddress: (v) => v.trim() ? null : 'Vui lòng nhập địa chỉ thường trú',
      employmentType: (v) => v ? null : 'Vui lòng chọn loại hình công việc',
      companyName: (v) => v.trim() ? null : 'Vui lòng nhập tên công ty',
      monthlyIncome: (v) => (Number(v) > 0) ? null : 'Vui lòng nhập thu nhập hàng tháng',
      loanAmount: (v) => (Number(v) > 0) ? null : 'Vui lòng nhập số tiền vay',
      loanTerm: (v) => v ? null : 'Vui lòng chọn kỳ hạn vay',
      loanPurpose: (v) => v ? null : 'Vui lòng chọn mục đích vay',
      references: {
        name: (v) => v.trim() ? null : 'Vui lòng nhập họ tên',
        phone: (v) => /^0\d{9}$/.test(v.replace(/\s/g, '')) ? null : 'SĐT không hợp lệ',
      },
    },
  })

  const [attachments, setAttachments] = useState<File[]>([])

  const addFiles = (incoming: File[]) => {
    setAttachments((prev) => {
      const existingNames = new Set(prev.map((f) => f.name))
      return [...prev, ...incoming.filter((f) => !existingNames.has(f.name))]
    })
  }

  const removeFile = (index: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = form.onSubmit((values) => {
    console.log('Form submitted:', values)
  })

  const { agreed, confirmed } = form.getValues()

  return (
    <div className={styles.page}>

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <Text className={styles.pageTitle}>Đơn Đăng Ký Vay Vốn</Text>
          <Text className={styles.pageSubtitle}>
            Vui lòng điền đầy đủ thông tin. Các trường có dấu <span className={styles.req}>*</span> là bắt buộc.
          </Text>
        </div>
        <div className={styles.headerActions}>
          <Button variant="subtle" color="gray" radius="md" onClick={() => form.reset()}>
            Đặt lại
          </Button>
          <Button
            variant="outline"
            leftSection={<IconDeviceFloppy size={16} />}
            radius="md"
            color="vibBlue"
          >
            Lưu nháp
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            radius="md"
            color="vibOrange"
            disabled={!agreed || !confirmed}
            onClick={() => handleSubmit()}
          >
            Nộp đơn
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formWrap}>

          {/* ── 1. Thông tin cá nhân ── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionIcon} style={{ background: '#eff6ff' }}>
                <IconUser size={18} color="#004b8d" />
              </div>
              <div>
                <Text className={styles.sectionTitle}>Thông Tin Cá Nhân</Text>
                <Text className={styles.sectionDesc}>Thông tin định danh của người đăng ký</Text>
              </div>
            </div>
            <Divider color="#f1f5f9" />

            <div className={styles.grid2}>
              <div>
                <Text className={styles.label}>Họ và tên <span className={styles.req}>*</span></Text>
                <TextInput placeholder="Nguyễn Văn A" radius="md" {...form.getInputProps('fullName')} />
              </div>
              <div>
                <Text className={styles.label}>Ngày sinh <span className={styles.req}>*</span></Text>
                <DatePickerInput
                  placeholder="DD/MM/YYYY"
                  valueFormat="DD/MM/YYYY"
                  radius="md"
                  maxDate={new Date()}
                  {...form.getInputProps('dob')}
                />
              </div>
              <div>
                <Text className={styles.label}>Giới tính <span className={styles.req}>*</span></Text>
                <Select
                  data={['Nam', 'Nữ', 'Khác']}
                  placeholder="Chọn giới tính"
                  radius="md"
                  {...form.getInputProps('gender')}
                />
              </div>
              <div>
                <Text className={styles.label}>Tình trạng hôn nhân</Text>
                <Select
                  data={['Độc thân', 'Đã kết hôn', 'Ly hôn', 'Góa']}
                  placeholder="Chọn tình trạng"
                  radius="md"
                  {...form.getInputProps('maritalStatus')}
                />
              </div>
              <div>
                <Text className={styles.label}>Số CMND / CCCD <span className={styles.req}>*</span></Text>
                <TextInput placeholder="012345678901" radius="md" {...form.getInputProps('idNumber')} />
              </div>
              <div>
                <Text className={styles.label}>Ngày cấp <span className={styles.req}>*</span></Text>
                <DatePickerInput
                  placeholder="DD/MM/YYYY"
                  valueFormat="DD/MM/YYYY"
                  radius="md"
                  maxDate={new Date()}
                  {...form.getInputProps('issueDate')}
                />
              </div>
              <div>
                <Text className={styles.label}>Nơi cấp <span className={styles.req}>*</span></Text>
                <TextInput placeholder="Cục cảnh sát QLHC về TTXH" radius="md" {...form.getInputProps('issuePlace')} />
              </div>
              <div>
                <Text className={styles.label}>Quốc tịch</Text>
                <Select
                  data={['Việt Nam', 'Mỹ', 'Anh', 'Nhật Bản', 'Hàn Quốc', 'Khác']}
                  radius="md"
                  {...form.getInputProps('nationality')}
                />
              </div>
            </div>
          </section>

          {/* ── 2. Thông tin liên hệ ── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionIcon} style={{ background: '#fff7ed' }}>
                <IconPhone size={18} color="#f37021" />
              </div>
              <div>
                <Text className={styles.sectionTitle}>Thông Tin Liên Hệ</Text>
                <Text className={styles.sectionDesc}>Địa chỉ và thông tin liên lạc</Text>
              </div>
            </div>
            <Divider color="#f1f5f9" />

            <div className={styles.grid2}>
              <div>
                <Text className={styles.label}>Số điện thoại <span className={styles.req}>*</span></Text>
                <TextInput placeholder="0901 234 567" radius="md" {...form.getInputProps('phone')} />
              </div>
              <div>
                <Text className={styles.label}>Email</Text>
                <TextInput placeholder="example@email.com" type="email" radius="md" {...form.getInputProps('email')} />
              </div>
              <div>
                <Text className={styles.label}>Tỉnh / Thành phố <span className={styles.req}>*</span></Text>
                <Select
                  data={['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương', 'Đồng Nai', 'Khác']}
                  placeholder="Chọn tỉnh/thành"
                  radius="md"
                  {...form.getInputProps('province')}
                />
              </div>
              <div>
                <Text className={styles.label}>Quận / Huyện <span className={styles.req}>*</span></Text>
                <TextInput placeholder="Quận 1" radius="md" {...form.getInputProps('district')} />
              </div>
              <div className={styles.span2}>
                <Text className={styles.label}>Địa chỉ thường trú <span className={styles.req}>*</span></Text>
                <TextInput placeholder="Số nhà, tên đường, phường/xã" radius="md" {...form.getInputProps('permanentAddress')} />
              </div>
              <div className={styles.span2}>
                <Text className={styles.label}>Địa chỉ hiện tại</Text>
                <TextInput placeholder="Để trống nếu giống địa chỉ thường trú" radius="md" {...form.getInputProps('currentAddress')} />
              </div>
              <div>
                <Text className={styles.label}>Tình trạng nhà ở</Text>
                <Select
                  data={['Nhà sở hữu riêng', 'Thuê nhà', 'Ở cùng gia đình', 'Khác']}
                  placeholder="Chọn tình trạng"
                  radius="md"
                  {...form.getInputProps('residentialStatus')}
                />
              </div>
              <div>
                <Text className={styles.label}>Thời gian cư trú tại địa chỉ (năm)</Text>
                <NumberInput placeholder="2" min={0} max={100} radius="md" {...form.getInputProps('residentialYears')} />
              </div>
            </div>
          </section>

          {/* ── 3. Thông tin nghề nghiệp ── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionIcon} style={{ background: '#f0fdf4' }}>
                <IconBriefcase size={18} color="#16a34a" />
              </div>
              <div>
                <Text className={styles.sectionTitle}>Thông Tin Nghề Nghiệp & Thu Nhập</Text>
                <Text className={styles.sectionDesc}>Thông tin công việc và nguồn thu nhập hiện tại</Text>
              </div>
            </div>
            <Divider color="#f1f5f9" />

            <div className={styles.grid2}>
              <div>
                <Text className={styles.label}>Loại hình công việc <span className={styles.req}>*</span></Text>
                <Select
                  data={['Nhân viên văn phòng', 'Kinh doanh tự do', 'Công nhân', 'Công chức / Viên chức', 'Freelancer', 'Khác']}
                  placeholder="Chọn loại hình"
                  radius="md"
                  {...form.getInputProps('employmentType')}
                />
              </div>
              <div>
                <Text className={styles.label}>Tên công ty / tổ chức <span className={styles.req}>*</span></Text>
                <TextInput placeholder="Công ty TNHH ABC" radius="md" {...form.getInputProps('companyName')} />
              </div>
              <div>
                <Text className={styles.label}>Chức vụ / Vị trí</Text>
                <TextInput placeholder="Kế toán trưởng" radius="md" {...form.getInputProps('position')} />
              </div>
              <div>
                <Text className={styles.label}>Ngày bắt đầu làm việc</Text>
                <DatePickerInput
                  placeholder="DD/MM/YYYY"
                  valueFormat="DD/MM/YYYY"
                  radius="md"
                  maxDate={new Date()}
                  {...form.getInputProps('startDate')}
                />
              </div>
              <div>
                <Text className={styles.label}>Thu nhập hàng tháng (VNĐ) <span className={styles.req}>*</span></Text>
                <NumberInput
                  placeholder="15,000,000"
                  thousandSeparator=","
                  min={0}
                  radius="md"
                  {...form.getInputProps('monthlyIncome')}
                />
              </div>
              <div>
                <Text className={styles.label}>Thu nhập khác (VNĐ)</Text>
                <NumberInput
                  placeholder="0"
                  thousandSeparator=","
                  min={0}
                  radius="md"
                  {...form.getInputProps('otherIncome')}
                />
              </div>
              <div className={styles.span2}>
                <Text className={styles.label}>Địa chỉ công ty</Text>
                <TextInput placeholder="Số nhà, tên đường, quận, thành phố" radius="md" {...form.getInputProps('workAddress')} />
              </div>
              <div className={styles.span2}>
                <Text className={styles.label}>Mô tả công việc</Text>
                <Textarea placeholder="Mô tả ngắn gọn về công việc và trách nhiệm hiện tại..." radius="md" rows={3} {...form.getInputProps('jobDescription')} />
              </div>
            </div>
          </section>

          {/* ── 4. Thông tin khoản vay ── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionIcon} style={{ background: '#fef3eb' }}>
                <IconCurrencyDollar size={18} color="#f37021" />
              </div>
              <div>
                <Text className={styles.sectionTitle}>Thông Tin Khoản Vay</Text>
                <Text className={styles.sectionDesc}>Chi tiết về khoản vay mong muốn</Text>
              </div>
            </div>
            <Divider color="#f1f5f9" />

            <div className={styles.grid2}>
              <div>
                <Text className={styles.label}>Số tiền vay (VNĐ) <span className={styles.req}>*</span></Text>
                <NumberInput
                  placeholder="100,000,000"
                  thousandSeparator=","
                  min={0}
                  radius="md"
                  {...form.getInputProps('loanAmount')}
                />
              </div>
              <div>
                <Text className={styles.label}>Kỳ hạn vay <span className={styles.req}>*</span></Text>
                <Select
                  data={['12 tháng', '24 tháng', '36 tháng', '48 tháng', '60 tháng', '84 tháng', '120 tháng']}
                  placeholder="Chọn kỳ hạn"
                  radius="md"
                  {...form.getInputProps('loanTerm')}
                />
              </div>
              <div>
                <Text className={styles.label}>Mục đích vay <span className={styles.req}>*</span></Text>
                <Select
                  data={['Mua nhà / đất', 'Sửa chữa nhà', 'Mua xe ô tô', 'Kinh doanh', 'Tiêu dùng cá nhân', 'Học tập', 'Du lịch', 'Khác']}
                  placeholder="Chọn mục đích"
                  radius="md"
                  {...form.getInputProps('loanPurpose')}
                />
              </div>
              <div>
                <Text className={styles.label}>Hình thức trả nợ</Text>
                <Select
                  data={['Trả đều hàng tháng (dư nợ giảm dần)', 'Trả lãi hàng tháng + vốn cuối kỳ', 'Linh hoạt']}
                  placeholder="Chọn hình thức"
                  radius="md"
                  {...form.getInputProps('repaymentMethod')}
                />
              </div>
              <div>
                <Text className={styles.label}>Số tài khoản nhận tiền</Text>
                <TextInput placeholder="0123456789" radius="md" {...form.getInputProps('accountNumber')} />
              </div>
              <div>
                <Text className={styles.label}>Ngân hàng</Text>
                <Select
                  data={['VIB', 'Vietcombank', 'Techcombank', 'BIDV', 'Agribank', 'MB Bank', 'ACB', 'Sacombank']}
                  radius="md"
                  {...form.getInputProps('bank')}
                />
              </div>
              <div className={styles.span2}>
                <Text className={styles.label}>Mục đích sử dụng vốn chi tiết</Text>
                <Textarea
                  placeholder="Mô tả cụ thể mục đích sử dụng khoản vay..."
                  radius="md"
                  rows={3}
                  {...form.getInputProps('loanPurposeDetail')}
                />
              </div>
            </div>
          </section>

          {/* ── 5. Người tham chiếu (dynamic) ── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionIcon} style={{ background: '#f5f3ff' }}>
                <IconShield size={18} color="#7c3aed" />
              </div>
              <div>
                <Text className={styles.sectionTitle}>Người Tham Chiếu</Text>
                <Text className={styles.sectionDesc}>Ít nhất 1 người tham chiếu không cùng hộ khẩu với người vay</Text>
              </div>
            </div>
            <Divider color="#f1f5f9" />

            <div className={styles.dynamicList}>
              {form.getValues().references.map((_, i) => (
                <div key={i} className={styles.dynamicRow}>
                  <div className={styles.dynamicRowHead}>
                    <Text size="sm" fw={600} c="#64748b">Người tham chiếu #{i + 1}</Text>
                    {form.getValues().references.length > 1 && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => form.removeListItem('references', i)}
                      >
                        <IconTrash size={15} />
                      </ActionIcon>
                    )}
                  </div>
                  <div className={styles.grid3}>
                    <div>
                      <Text className={styles.label}>Họ và tên <span className={styles.req}>*</span></Text>
                      <TextInput
                        placeholder="Nguyễn Thị B"
                        radius="md"
                        {...form.getInputProps(`references.${i}.name`)}
                      />
                    </div>
                    <div>
                      <Text className={styles.label}>Mối quan hệ</Text>
                      <Select
                        data={['Bạn bè', 'Đồng nghiệp', 'Họ hàng', 'Hàng xóm', 'Khác']}
                        placeholder="Chọn quan hệ"
                        radius="md"
                        {...form.getInputProps(`references.${i}.relationship`)}
                      />
                    </div>
                    <div>
                      <Text className={styles.label}>Số điện thoại <span className={styles.req}>*</span></Text>
                      <TextInput
                        placeholder="0901 234 567"
                        radius="md"
                        {...form.getInputProps(`references.${i}.phone`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="subtle"
              color="vibBlue"
              leftSection={<IconPlus size={15} />}
              size="sm"
              radius="md"
              onClick={() => form.insertListItem('references', { name: '', relationship: null, phone: '' })}
            >
              Thêm người tham chiếu
            </Button>
          </section>

          {/* ── 6. Tài sản đảm bảo (dynamic) ── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionIcon} style={{ background: '#fef9c3' }}>
                <IconFileDescription size={18} color="#ca8a04" />
              </div>
              <div>
                <Text className={styles.sectionTitle}>Tài Sản Đảm Bảo</Text>
                <Text className={styles.sectionDesc}>Danh sách tài sản dùng làm thế chấp (nếu có)</Text>
              </div>
            </div>
            <Divider color="#f1f5f9" />

            <div className={styles.dynamicList}>
              {form.getValues().assets.map((_, i) => (
                <div key={i} className={styles.dynamicRow}>
                  <div className={styles.dynamicRowHead}>
                    <Text size="sm" fw={600} c="#64748b">Tài sản #{i + 1}</Text>
                    {form.getValues().assets.length > 1 && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => form.removeListItem('assets', i)}
                      >
                        <IconTrash size={15} />
                      </ActionIcon>
                    )}
                  </div>
                  <div className={styles.grid2}>
                    <div>
                      <Text className={styles.label}>Loại tài sản</Text>
                      <Select
                        data={['Bất động sản', 'Ô tô / Xe máy', 'Máy móc / Thiết bị', 'Tiền gửi / Sổ tiết kiệm', 'Khác']}
                        placeholder="Chọn loại tài sản"
                        radius="md"
                        {...form.getInputProps(`assets.${i}.assetType`)}
                      />
                    </div>
                    <div>
                      <Text className={styles.label}>Giá trị ước tính (VNĐ)</Text>
                      <NumberInput
                        placeholder="500,000,000"
                        thousandSeparator=","
                        min={0}
                        radius="md"
                        {...form.getInputProps(`assets.${i}.value`)}
                      />
                    </div>
                    <div className={styles.span2}>
                      <Text className={styles.label}>Mô tả / Địa chỉ tài sản</Text>
                      <TextInput
                        placeholder="Địa chỉ bất động sản / biển số xe / mô tả chi tiết"
                        radius="md"
                        {...form.getInputProps(`assets.${i}.description`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="subtle"
              color="vibBlue"
              leftSection={<IconPlus size={15} />}
              size="sm"
              radius="md"
              onClick={() => form.insertListItem('assets', { assetType: null, value: '', description: '' })}
            >
              Thêm tài sản
            </Button>
          </section>

          {/* ── 7. Tài liệu đính kèm ── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionIcon} style={{ background: '#f0f9ff' }}>
                <IconPaperclip size={18} color="#0284c7" />
              </div>
              <div>
                <Text className={styles.sectionTitle}>Tài Liệu Đính Kèm</Text>
                <Text className={styles.sectionDesc}>
                  CMND/CCCD, hộ khẩu, xác nhận thu nhập, hợp đồng lao động... (PDF, DOC, JPG, PNG — tối đa 10 MB/file)
                </Text>
              </div>
            </div>
            <Divider color="#f1f5f9" />

            <Dropzone
              onDrop={addFiles}
              accept={ACCEPT_MIME}
              maxSize={10 * 1024 * 1024}
              className={styles.dropzone}
            >
              <div className={styles.dropzoneInner}>
                <Dropzone.Accept>
                  <IconCloudUpload size={36} color="#004b8d" />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX size={36} color="#ef4444" />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconCloudUpload size={36} color="#9ca3af" />
                </Dropzone.Idle>
                <div>
                  <Text size="sm" fw={600} c="#1e293b" ta="center">
                    Kéo thả file vào đây hoặc{' '}
                    <Text component="span" c="vibBlue" style={{ cursor: 'pointer' }}>
                      chọn file
                    </Text>
                  </Text>
                  <Text size="xs" c="dimmed" ta="center" mt={4}>
                    Hỗ trợ PDF, DOC, DOCX, JPG, PNG — tối đa 10 MB mỗi file
                  </Text>
                </div>
              </div>
            </Dropzone>

            {attachments.length > 0 && (
              <div className={styles.fileList}>
                {attachments.map((file, i) => (
                  <div key={i} className={styles.fileItem}>
                    <div className={styles.fileIcon}>
                      <FileIcon name={file.name} />
                    </div>
                    <div className={styles.fileMeta}>
                      <Text size="sm" fw={500} className={styles.fileName}>{file.name}</Text>
                      <Text size="xs" c="dimmed">{formatBytes(file.size)}</Text>
                    </div>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeFile(i)}
                    >
                      <IconTrash size={15} />
                    </ActionIcon>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── 8. Thông tin bổ sung & xác nhận ── */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionIcon} style={{ background: '#f1f5f9' }}>
                <IconNotes size={18} color="#64748b" />
              </div>
              <div>
                <Text className={styles.sectionTitle}>Thông Tin Bổ Sung & Xác Nhận</Text>
                <Text className={styles.sectionDesc}>Ghi chú và cam kết của người đăng ký</Text>
              </div>
            </div>
            <Divider color="#f1f5f9" />

            <div className={styles.grid2}>
              <div>
                <Text className={styles.label}>Kênh biết đến VIB</Text>
                <Select
                  data={['Bạn bè / Người thân giới thiệu', 'Mạng xã hội', 'Google / Internet', 'TV / Radio', 'Nhân viên tư vấn', 'Khác']}
                  placeholder="Chọn kênh"
                  radius="md"
                  {...form.getInputProps('referralChannel')}
                />
              </div>
              <div>
                <Text className={styles.label}>Số hồ sơ tham chiếu (nếu có)</Text>
                <TextInput placeholder="VIB-2024-XXXXXX" radius="md" {...form.getInputProps('referenceCode')} />
              </div>
              <div className={styles.span2}>
                <Text className={styles.label}>Ghi chú / Yêu cầu đặc biệt</Text>
                <Textarea placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt nếu có..." radius="md" rows={4} {...form.getInputProps('notes')} />
              </div>
            </div>

            <Divider color="#f1f5f9" />

            <div className={styles.agreements}>
              <Checkbox
                color="vibOrange"
                radius="sm"
                label={
                  <Text size="sm">
                    Tôi đồng ý với{' '}
                    <a href="#" className={styles.link}>Điều khoản sử dụng</a>
                    {' '}và{' '}
                    <a href="#" className={styles.link}>Chính sách bảo mật</a>
                    {' '}của VIB. Tôi đồng ý để VIB thu thập, xử lý và lưu trữ thông tin cá nhân của tôi.
                  </Text>
                }
                {...form.getInputProps('agreed', { type: 'checkbox' })}
              />
              <Checkbox
                color="vibOrange"
                radius="sm"
                label={
                  <Text size="sm">
                    Tôi cam kết tất cả thông tin khai báo trong đơn này là trung thực và chính xác. Tôi hiểu rằng việc cung cấp thông tin sai lệch có thể dẫn đến từ chối hồ sơ và các hậu quả pháp lý liên quan.
                  </Text>
                }
                {...form.getInputProps('confirmed', { type: 'checkbox' })}
              />
            </div>
          </section>

          {/* ── Footer ── */}
          <div className={styles.footer}>
            <Button variant="subtle" color="gray" radius="md" onClick={() => form.reset()}>
              Đặt lại
            </Button>
            <div className={styles.footerRight}>
              <Button
                variant="outline"
                leftSection={<IconDeviceFloppy size={16} />}
                radius="md"
                color="vibBlue"
              >
                Lưu nháp
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                radius="md"
                color="vibOrange"
                disabled={!agreed || !confirmed}
              >
                Nộp đơn
              </Button>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
