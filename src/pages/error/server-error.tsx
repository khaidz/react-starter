import { Button } from '@mantine/core'
import { IconArrowLeft, IconHome, IconRefresh } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router'
import vibLogo from '@/assets/images/VIB_Logo_Symbol.svg'
import styles from './error.module.scss'

interface ServerErrorPageProps {
  error?: Error
  onReset?: () => void
}

export function ServerErrorPage({ error, onReset }: ServerErrorPageProps) {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <img src={vibLogo} alt="VIB" />
          <span>VIB</span>
        </Link>
        <Button variant="outline" size="sm" className={styles.supportBtn}>
          Contact Support
        </Button>
      </header>

      <div className={styles.body}>
      <div className={styles.illustration}>
        <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground */}
          <ellipse cx="90" cy="148" rx="70" ry="8" fill="#e5e7eb" />
          {/* Server box */}
          <rect x="45" y="55" width="90" height="85" rx="10" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
          {/* Server rows */}
          <rect x="56" y="68" width="68" height="16" rx="5" fill="#f4f7fa" stroke="#e5e7eb" strokeWidth="1.5" />
          <rect x="56" y="90" width="68" height="16" rx="5" fill="#f4f7fa" stroke="#e5e7eb" strokeWidth="1.5" />
          <rect x="56" y="112" width="68" height="16" rx="5" fill="#f4f7fa" stroke="#e5e7eb" strokeWidth="1.5" />
          {/* LED lights */}
          <circle cx="116" cy="76" r="3.5" fill="#16a34a" />
          <circle cx="116" cy="98" r="3.5" fill="#f37021" />
          <circle cx="116" cy="120" r="3.5" fill="#dc2626" />
          {/* Blink lines on last row */}
          <line x1="62" y1="120" x2="102" y2="120" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
          {/* Warning icon floating above */}
          <circle cx="90" cy="32" r="20" fill="#fef2f2" stroke="#fca5a5" strokeWidth="2" />
          <text x="85" y="39" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="#dc2626">!</text>
          {/* Sparks */}
          <line x1="64" y1="50" x2="58" y2="43" stroke="#f37021" strokeWidth="2" strokeLinecap="round" />
          <line x1="90" y1="47" x2="90" y2="39" stroke="#f37021" strokeWidth="2" strokeLinecap="round" />
          <line x1="116" y1="50" x2="122" y2="43" stroke="#f37021" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className={`${styles.code} ${styles.code500}`}>500</div>
      <div className={styles.title}>Đã xảy ra lỗi máy chủ</div>
      <div className={styles.desc}>
        Hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ nếu lỗi vẫn tiếp tục.
      </div>

      <div className={styles.actions}>
        <Button
          variant="outline"
          leftSection={<IconArrowLeft size={16} />}
          radius="md"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
        <Button
          variant="light"
          color="orange"
          leftSection={<IconRefresh size={16} />}
          radius="md"
          onClick={() => {
            onReset?.()
            window.location.reload()
          }}
        >
          Thử lại
        </Button>
        <Button
          component={Link}
          to="/"
          leftSection={<IconHome size={16} />}
          radius="md"
        >
          Về trang chủ
        </Button>
      </div>

      {error?.message && (
        <div className={styles.detail}>
          <div className={styles.detailLabel}>Chi tiết lỗi</div>
          <div className={styles.detailMsg}>{error.message}</div>
        </div>
      )}
      </div>
    </div>
  )
}
