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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  IconBell,
  IconBuildingSkyscraper,
  IconKey,
  IconUsers,
  IconGitFork,
  IconLayoutDashboard,
  IconLogout,
  IconPlayerPlay,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconShieldLock,
  IconUser,
} from '@tabler/icons-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { authApi } from '@/api/auth.api'
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

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  {
    to: '/workflow-config',
    label: 'Workflow Config',
    icon: IconGitFork,
    roles: [Roles.ADMIN],
  },
  {
    to: '/workflow-runner',
    label: 'Workflow Runner',
    icon: IconPlayerPlay,
  },
  {
    to: '/permissions',
    label: 'Permissions',
    icon: IconShieldCheck,
    roles: [Roles.ADMIN],
  },
  {
    to: '/roles',
    label: 'Roles',
    icon: IconShieldLock,
    roles: [Roles.ADMIN],
  },
  {
    to: '/departments',
    label: 'Departments',
    icon: IconBuildingSkyscraper,
    roles: [Roles.ADMIN],
  },
  {
    to: '/users',
    label: 'Users',
    icon: IconUsers,
    roles: [Roles.ADMIN],
  },
  {
    to: '/api-keys',
    label: 'API Keys',
    icon: IconKey,
    roles: [Roles.ADMIN],
  },
]

export function MainLayout() {
  const [opened, { toggle, close }] = useDisclosure()
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()
  const { can } = usePermission()
  const queryClient = useQueryClient()

  const visibleNavItems = NAV_ITEMS.filter(({ roles, permissions }) => can(roles, permissions))

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
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      header={{ height: 60 }}
      padding={0}
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
            <Tooltip label="Notifications">
              <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                <IconBell size={20} />
              </ActionIcon>
            </Tooltip>

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
          <div className={styles.navLogo}>
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
              <span className={styles.logoTextSidebar}>VIB</span>
            </NavLink>
            <Burger
              opened={opened}
              onClick={close}
              hiddenFrom="sm"
              size="sm"
              color="rgba(255,255,255,0.7)"
              style={{ marginLeft: 'auto' }}
            />
          </div>

          <nav className={styles.navBody}>
            <div className={styles.navLabel}>Navigation</div>
            {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={close}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
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
