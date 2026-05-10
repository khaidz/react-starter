import type React from 'react'
import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Divider,
  Menu,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  IconBell,
  IconBuildingSkyscraper,
  IconKey,
  IconUsers,
  IconLayoutDashboard,
  IconLogout,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconShieldLock,
  IconUser,
  IconChevronsLeft,
  IconChevronsRight,
  IconClockPlay,
  IconCalendarEvent,
  IconCalendarStats,
  IconCalendarCheck,
} from '@tabler/icons-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { authApi } from '@/api/auth.api'
import { NotificationBell } from '@/components/notification-bell'
import vibLogo from '@/assets/images/VIB_Logo_Symbol.svg'
import { useAuth } from '@/hooks/use-auth'
import { usePermission } from '@/hooks/use-permission'
import { Roles } from '@/lib/permissions'
import styles from './main-layout.module.scss'

interface NavItem {
  to: string
  label: string
  icon: React.FC<{ size?: number }>
  end?: boolean
  roles?: string[]
  permissions?: string[]
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
    ],
  },
  {
    label: 'Leave',
    items: [
      { to: '/leave/requests', label: 'Leave Requests', icon: IconCalendarEvent },
      { to: '/leave/balances', label: 'Leave Balances', icon: IconCalendarStats, roles: [Roles.ADMIN] },
      { to: '/leave/types', label: 'Leave Types', icon: IconCalendarCheck, roles: [Roles.ADMIN] },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/departments', label: 'Departments', icon: IconBuildingSkyscraper, roles: [Roles.ADMIN] },
      { to: '/users', label: 'Users', icon: IconUsers, roles: [Roles.ADMIN] },
      { to: '/roles', label: 'Roles', icon: IconShieldLock, roles: [Roles.ADMIN] },
      { to: '/permissions', label: 'Permissions', icon: IconShieldCheck, roles: [Roles.ADMIN] },
      { to: '/api-keys', label: 'API Keys', icon: IconKey, roles: [Roles.ADMIN] },
      { to: '/notifications/admin', label: 'Notifications', icon: IconBell, roles: [Roles.ADMIN] },
      { to: '/jobs', label: 'Jobs', icon: IconClockPlay, roles: [Roles.ADMIN] },
    ],
  },
]

export function MainLayout() {
  const [opened, { toggle, close }] = useDisclosure()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const toggleSidebar = () => setSidebarCollapsed(prev => {
    localStorage.setItem('sidebar-collapsed', String(!prev))
    return !prev
  })
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()
  const { can } = usePermission()
  const queryClient = useQueryClient()

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(({ roles, permissions }) => can(roles, permissions)),
  })).filter((section) => section.items.length > 0)

  const { mutate: logout } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })

  return (
    <AppShell
      layout="alt"
      navbar={{ width: sidebarCollapsed ? 64 : 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      header={{ height: 53 }}
      padding={0}
      styles={{ navbar: { transition: 'width 200ms ease' } }}
    >
      {/* ── Header ── */}
      <AppShell.Header>
        <div className={styles.header}>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

          <TextInput
            placeholder="Search..."
            leftSection={<IconSearch size={15} color="#9ca3af" />}
            className={styles.headerSearch}
            radius="sm"
            size="sm"
          />

          {/* Right actions */}
          <div className={styles.headerRight}>
            <NotificationBell />

            <Tooltip label="Settings">
              <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                <IconSettings size={20} />
              </ActionIcon>
            </Tooltip>

            <Divider orientation="vertical" mx={4} />

            <Menu shadow="md" width={190} position="bottom-end">
              <Menu.Target>
                <div className={styles.userBlock}>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user?.username ?? 'Admin User'}</div>
                    <div className={styles.userDept}>{user?.deptName ?? 'Operations Dept'}</div>
                  </div>
                  <Avatar size={34} radius="xl" src={null} color="blue">
                    {(user?.username?.[0] ?? 'A').toUpperCase()}
                  </Avatar>
                </div>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.username ?? 'Admin User'}</Menu.Label>
                <Menu.Item leftSection={<IconUser size={15} />}>Profile</Menu.Item>
                <Menu.Item leftSection={<IconSettings size={15} />}>Settings</Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={15} />}
                  onClick={() => logout()}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>
      </AppShell.Header>

      {/* ── Sidebar ── */}
      <AppShell.Navbar>
        <div className={styles.navbar}>
          {/* Logo — hiển thị trong sidebar khi layout="alt" */}
          <div
            className={styles.navLogo}
            style={{ justifyContent: sidebarCollapsed ? 'center' : undefined }}
          >
            <NavLink
              to="/"
              end
              onClick={close}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                textDecoration: 'none',
              }}
            >
              <img src={vibLogo} alt="VIB" style={{ width: 32, height: 32 }} />
              {!sidebarCollapsed && <span className={styles.logoTextSidebar}>VIB</span>}
            </NavLink>
            {!sidebarCollapsed && (
              <Burger
                opened={opened}
                onClick={close}
                hiddenFrom="sm"
                size="sm"
                color="rgba(255,255,255,0.7)"
                style={{ marginLeft: 'auto' }}
              />
            )}
          </div>

          <nav className={styles.navBody}>
            {visibleSections.map((section) => (
              <div key={section.label} className={styles.navSection}>
                {!sidebarCollapsed && <div className={styles.navLabel}>{section.label}</div>}
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <Tooltip key={to} label={label} position="right" withArrow disabled={!sidebarCollapsed}>
                    <div style={{ width: '100%' }}>
                      <NavLink
                        to={to}
                        end={end}
                        onClick={close}
                        className={({ isActive }) =>
                          `${styles.navLink} ${sidebarCollapsed ? styles.navLinkCollapsed : ''} ${isActive ? styles.active : ''}`
                        }
                      >
                        <Icon size={18} />
                        {!sidebarCollapsed && label}
                      </NavLink>
                    </div>
                  </Tooltip>
                ))}
              </div>
            ))}
          </nav>

          <div className={`${styles.navToggle} ${sidebarCollapsed ? styles.navToggleCollapsed : ''}`}>
            <ActionIcon variant="subtle" onClick={toggleSidebar} className={styles.toggleBtn}>
              {sidebarCollapsed ? <IconChevronsRight size={16} /> : <IconChevronsLeft size={16} />}
            </ActionIcon>
          </div>
        </div>
      </AppShell.Navbar>

      {/* ── Content ── */}
      <AppShell.Main style={{ background: '#ededed70' }}>
        <div style={{ padding: '1rem', minHeight: '100%' }}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}
