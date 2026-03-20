import { Button } from '@mantine/core'
import { IconArrowLeft, IconHome } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router'
import vibLogo from '@/assets/images/VIB_Logo_Symbol.svg'
import styles from './error.module.scss'

export function ForbiddenPage() {
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
            <ellipse cx="90" cy="148" rx="70" ry="8" fill="#e5e7eb" />
            <rect x="55" y="60" width="70" height="80" rx="12" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
            {/* Lock icon on screen */}
            <rect x="68" y="72" width="44" height="35" rx="6" fill="#fef3eb" />
            <rect x="82" y="88" width="16" height="12" rx="3" fill="#f37021" />
            <path d="M85 88 V84 a5 5 0 0 1 10 0 V88" stroke="#f37021" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="90" cy="93" r="2" fill="#fff" />
            {/* Legs */}
            <rect x="68" y="138" width="14" height="10" rx="4" fill="#cbd5e1" />
            <rect x="98" y="138" width="14" height="10" rx="4" fill="#cbd5e1" />
            {/* Arms crossed */}
            <rect x="35" y="82" width="22" height="10" rx="5" fill="#cbd5e1" transform="rotate(15 35 82)" />
            <rect x="123" y="82" width="22" height="10" rx="5" fill="#cbd5e1" transform="rotate(-15 123 82)" />
            {/* Head */}
            <circle cx="90" cy="48" r="22" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
            {/* Eyes — angry */}
            <path d="M80 41 L86 44" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <path d="M100 41 L94 44" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <circle cx="83" cy="46" r="2.5" fill="#1e293b" />
            <circle cx="97" cy="46" r="2.5" fill="#1e293b" />
            {/* Mouth */}
            <path d="M84 56 Q90 52 96 56" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Antenna */}
            <line x1="90" y1="26" x2="90" y2="18" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <circle cx="90" cy="15" r="4" fill="#dc2626" />
          </svg>
        </div>

        <div className={styles.code}>403</div>
        <div className={styles.title}>Bạn không có quyền truy cập</div>
        <div className={styles.desc}>
          Tài khoản của bạn không có đủ quyền để xem trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
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
            component={Link}
            to="/"
            leftSection={<IconHome size={16} />}
            radius="md"
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}
