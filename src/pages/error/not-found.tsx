import { Button } from '@mantine/core'
import { IconArrowLeft, IconHome } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router'
import vibLogo from '@/assets/images/VIB_Logo_Symbol.svg'
import styles from './error.module.scss'

export function NotFoundPage() {
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
          {/* Body */}
          <rect x="55" y="60" width="70" height="80" rx="12" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
          {/* Screen */}
          <rect x="65" y="72" width="50" height="35" rx="6" fill="#f4f7fa" />
          {/* Question marks on screen */}
          <text x="76" y="97" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="900" fill="#004b8d">?</text>
          <text x="98" y="92" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="900" fill="#004b8d" opacity="0.4">?</text>
          {/* Legs */}
          <rect x="68" y="138" width="14" height="10" rx="4" fill="#cbd5e1" />
          <rect x="98" y="138" width="14" height="10" rx="4" fill="#cbd5e1" />
          {/* Arms */}
          <rect x="35" y="75" width="22" height="10" rx="5" fill="#cbd5e1" transform="rotate(-20 35 75)" />
          <rect x="123" y="75" width="22" height="10" rx="5" fill="#cbd5e1" transform="rotate(20 123 75)" />
          {/* Head */}
          <circle cx="90" cy="48" r="22" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="83" cy="44" r="3" fill="#1e293b" />
          <circle cx="97" cy="44" r="3" fill="#1e293b" />
          {/* Confused mouth */}
          <path d="M83 55 Q90 51 97 55" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Antenna */}
          <line x1="90" y1="26" x2="90" y2="18" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <circle cx="90" cy="15" r="4" fill="#f37021" />
        </svg>
      </div>

      <div className={styles.code}>404</div>
      <div className={styles.title}>Page Not Found</div>
      <div className={styles.desc}>
        The page you are looking for may have been removed, renamed, or is temporarily unavailable.
      </div>

      <div className={styles.actions}>
        <Button
          variant="outline"
          leftSection={<IconArrowLeft size={16} />}
          radius="md"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          component={Link}
          to="/"
          leftSection={<IconHome size={16} />}
          radius="md"
        >
          Home
        </Button>
      </div>
      </div>
    </div>
  )
}
