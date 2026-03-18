import { Button } from '@mantine/core'
import { IconShield, IconTransfer } from '@tabler/icons-react'
import { Link, Outlet } from 'react-router'
import vibLogo from '@/assets/images/VIB_Logo_Symbol.svg'
import styles from './auth-layout.module.scss'

export function AuthLayout() {
  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <img src={vibLogo} alt="VIB Logo" className={styles.logoIcon} />
          <span className={styles.vibText}>VIB</span>
        </Link>

        <div className={styles.headerRight}>
          <Button variant="outline" size="sm" className={styles.supportBtn}>
            Contact Support
          </Button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className={styles.main}>
        {/* Left: marketing */}
        <div className={styles.left}>
          <h1 className={styles.heading}>
            Experience Next-Gen
            <br />
            <span className={styles.headingAccent}>Digital Banking</span>
          </h1>

          <p className={styles.subtext}>
            Securely manage your finances with Vietnam&apos;s most innovative retail bank. Fast,
            reliable, and always at your fingertips.
          </p>

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.blue}`}>
                <IconShield size={20} />
              </div>
              <span className={styles.featureName}>Highly Secure</span>
              <span className={styles.featureDesc}>Multi-factor authentication</span>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.orange}`}>
                <IconTransfer size={20} />
              </div>
              <span className={styles.featureName}>Instant Transfers</span>
              <span className={styles.featureDesc}>Real-time 24/7 processing</span>
            </div>
          </div>
        </div>

        {/* Right: page content (login / register form) */}
        <div className={styles.right}>
          <Outlet />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerCopy}>
          © {new Date().getFullYear()} Vietnam International Bank (VIB). All rights reserved.
        </span>
        <nav className={styles.footerLinks}>
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Security Tips</a>
        </nav>
      </footer>
    </div>
  )
}
