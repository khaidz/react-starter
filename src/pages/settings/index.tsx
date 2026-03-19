import { useRef, useState, useCallback } from 'react'
import {
  Avatar,
  Button,
  Divider,
  Select,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconBell,
  IconDeviceFloppy,
  IconEye,
  IconKey,
  IconLink,
  IconLogout,
  IconMoon,
  IconPalette,
  IconShield,
  IconSun,
  IconUser,
} from '@tabler/icons-react'
import { useAuth } from '@/hooks/use-auth'
import styles from './settings.module.scss'

type Section = 'profile' | 'security' | 'notifications' | 'appearance' | 'linked'

const NAV_ITEMS = [
  { key: 'profile',       label: 'Profile Information', icon: IconUser },
  { key: 'security',      label: 'Security & Privacy',  icon: IconShield },
  { key: 'notifications', label: 'Notifications',       icon: IconBell },
  { key: 'appearance',    label: 'Appearance',          icon: IconPalette },
  { key: 'linked',        label: 'Linked Accounts',     icon: IconLink },
]

export function SettingsPage() {
  const { user } = useAuth()
  const [active, setActive] = useState<Section>('profile')
  const [displayMode, setDisplayMode] = useState<'light' | 'dark'>('light')
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true })
  const [twoFA, setTwoFA] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const sectionRefs = useRef<Partial<Record<Section, HTMLElement | null>>>({})

  const scrollToSection = useCallback((key: Section) => {
    setActive(key)
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className={styles.page}>

      {/* ── Sidebar — desktop only ── */}
      {!isMobile && (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Text className={styles.sidebarTitle}>System Settings</Text>
            <Text className={styles.sidebarSub}>Configure your banking experience</Text>
          </div>

          <nav className={styles.sidebarNav}>
            {NAV_ITEMS.slice(0, 4).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`${styles.navItem} ${active === key ? styles.navActive : ''}`}
                onClick={() => scrollToSection(key as Section)}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}

            <Divider my="sm" color="#e5e7eb" />

            <button
              className={`${styles.navItem} ${active === 'linked' ? styles.navActive : ''}`}
              onClick={() => scrollToSection('linked')}
            >
              <IconLink size={17} />
              Linked Accounts
            </button>

            <button className={`${styles.navItem} ${styles.navLogout}`}>
              <IconLogout size={17} />
              Logout
            </button>
          </nav>

          <div className={styles.helpBox}>
            <Text className={styles.helpTitle}>Need help?</Text>
            <Text className={styles.helpDesc}>Contact our support if you're having trouble with your settings.</Text>
            <Button variant="outline" size="xs" fullWidth mt="xs" radius="md" color="vibBlue">
              Contact Center
            </Button>
          </div>
        </aside>
      )}

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* Mobile: Select thay sidebar */}
        {isMobile && (
          <Select
            value={active}
            onChange={(v) => v && setActive(v as Section)}
            data={NAV_ITEMS.map(({ key, label }) => ({ value: key, label }))}
            radius="md"
            size="sm"
          />
        )}

        <div className={styles.contentHeader}>
          <div>
            <Text className={styles.pageTitle}>Account Settings</Text>
            <Text className={styles.pageSubtitle}>Manage your personal information and profile visibility.</Text>
          </div>
          <Button leftSection={<IconDeviceFloppy size={16} />} radius="md" color="vibOrange">
            Save Changes
          </Button>
        </div>

        {/* ── Profile Photo ── */}
        {(!isMobile || active === 'profile') && (
          <section className={styles.section} ref={(el) => { sectionRefs.current.profile = el }}>
            <div className={styles.photoRow}>
              <div className={styles.avatarWrap}>
                <Avatar size={72} radius="xl" color="vibBlue" src={null}>
                  {(user?.username?.[0] ?? 'U').toUpperCase()}
                </Avatar>
                <div className={styles.avatarBadge}>
                  <IconUser size={12} color="#fff" />
                </div>
              </div>
              <div>
                <Text fw={600} size="sm">Profile Photo</Text>
                <Text size="xs" c="dimmed" mb={6}>JPG, GIF or PNG. Max size of 2MB</Text>
                <div className={styles.photoActions}>
                  <input ref={fileRef} type="file" accept="image/*" hidden />
                  <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                    Upload new
                  </button>
                  <button className={styles.removeBtn}>Remove</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Personal Info ── */}
        {(!isMobile || active === 'profile') && (
          <div className={styles.formGrid}>
            <div>
              <Text className={styles.fieldLabel}>Full Name</Text>
              <TextInput defaultValue={user?.username ?? 'Johnathan Doe'} radius="md" />
            </div>
            <div>
              <Text className={styles.fieldLabel}>Email Address</Text>
              <TextInput defaultValue="j.doe@example.com" radius="md" />
            </div>
            <div>
              <Text className={styles.fieldLabel}>Phone Number</Text>
              <TextInput defaultValue="+1 (555) 000-1234" radius="md" />
            </div>
            <div>
              <Text className={styles.fieldLabel}>Location</Text>
              <Select
                data={['United States', 'Vietnam', 'Singapore', 'Japan']}
                defaultValue="United States"
                radius="md"
              />
            </div>
          </div>
        )}

        {/* ── Security Settings ── */}
        {(!isMobile || active === 'security') && (
          <section className={styles.section} ref={(el) => { sectionRefs.current.security = el }}>
            <Text className={styles.sectionTitle}>
              <IconShield size={18} color="#004b8d" />
              Security Settings
            </Text>
            <div className={styles.settingRow}>
              <div className={styles.settingIcon} style={{ background: '#f1f5f9' }}>
                <IconKey size={18} color="#64748b" />
              </div>
              <div className={styles.settingInfo}>
                <Text size="sm" fw={600}>Change Password</Text>
                <Text size="xs" c="dimmed">Last changed 3 months ago</Text>
              </div>
              <Button variant="subtle" size="xs" color="vibBlue" radius="md">Update</Button>
            </div>
            <Divider color="#f1f5f9" />
            <div className={styles.settingRow}>
              <div className={styles.settingIcon} style={{ background: '#eff6ff' }}>
                <IconShield size={18} color="#004b8d" />
              </div>
              <div className={styles.settingInfo}>
                <Text size="sm" fw={600}>Two-Factor Authentication</Text>
                <Text size="xs" c="dimmed">Add an extra layer of security to your account</Text>
              </div>
              <Switch checked={twoFA} onChange={(e) => setTwoFA(e.currentTarget.checked)} color="vibOrange" />
            </div>
          </section>
        )}

        {/* ── Notification Preferences ── */}
        {(!isMobile || active === 'notifications') && (
          <section className={styles.section} ref={(el) => { sectionRefs.current.notifications = el }}>
            <Text className={styles.sectionTitle}>
              <IconBell size={18} color="#f37021" />
              Notification Preferences
            </Text>
            {[
              { key: 'email', label: 'Email Notifications',    desc: 'Receive transactional alerts and security news' },
              { key: 'sms',   label: 'SMS Notifications',      desc: 'Real-time alerts for card transactions' },
              { key: 'push',  label: 'App Push Notifications', desc: 'Direct notifications to your registered devices' },
            ].map(({ key, label, desc }, i, arr) => (
              <div key={key}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <Text size="sm" fw={600}>{label}</Text>
                    <Text size="xs" c="dimmed">{desc}</Text>
                  </div>
                  <Switch
                    checked={notifications[key as keyof typeof notifications]}
                    onChange={(e) => setNotifications((n) => ({ ...n, [key]: e.currentTarget.checked }))}
                    color="vibOrange"
                  />
                </div>
                {i < arr.length - 1 && <Divider color="#f1f5f9" />}
              </div>
            ))}
          </section>
        )}

        {/* ── Appearance Settings ── */}
        {(!isMobile || active === 'appearance') && (
          <section className={styles.section} ref={(el) => { sectionRefs.current.appearance = el }}>
            <Text className={styles.sectionTitle}>
              <IconEye size={18} color="#7c3aed" />
              Appearance Settings
            </Text>
            <Text size="sm" c="dimmed" mb="md">Display Mode</Text>
            <div className={styles.modeGrid}>
              <button
                className={`${styles.modeCard} ${displayMode === 'light' ? styles.modeActive : ''}`}
                onClick={() => setDisplayMode('light')}
              >
                <div className={styles.modePreview}>
                  <div className={styles.previewLight}>
                    <div className={styles.previewBar} />
                    <div className={styles.previewBlock} />
                  </div>
                </div>
                <span className={styles.modeLabel}>
                  <IconSun size={14} />
                  Light Mode
                </span>
              </button>
              <button
                className={`${styles.modeCard} ${displayMode === 'dark' ? styles.modeActive : ''}`}
                onClick={() => setDisplayMode('dark')}
              >
                <div className={styles.modePreview}>
                  <div className={styles.previewDark}>
                    <div className={styles.previewBar} />
                    <div className={styles.previewBlock} />
                  </div>
                </div>
                <span className={styles.modeLabel}>
                  <IconMoon size={14} />
                  Dark Mode
                </span>
              </button>
            </div>
          </section>
        )}

        {/* ── Linked Accounts ── */}
        {(!isMobile || active === 'linked') && (
          <section className={styles.section} ref={(el) => { sectionRefs.current.linked = el }}>
            <Text className={styles.sectionTitle}>
              <IconLink size={18} color="#004b8d" />
              Linked Accounts
            </Text>
            <Text size="sm" c="dimmed">No linked accounts yet.</Text>
          </section>
        )}

        {/* ── Footer actions ── */}
        <div className={styles.footerActions}>
          <Button variant="subtle" color="gray" radius="md">Cancel</Button>
          <Button leftSection={<IconDeviceFloppy size={16} />} radius="md" color="vibOrange">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
