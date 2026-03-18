import { useState } from 'react'
import { ActionIcon, Anchor, Avatar, Badge, Card, Grid, Group, Paper, SegmentedControl, SimpleGrid, Text } from '@mantine/core'
import { AreaChart } from '@mantine/charts'
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBolt,
  IconCreditCard,
  IconPlus,
  IconShoppingCart,
  IconTransfer,
  IconWallet,
} from '@tabler/icons-react'
import styles from './home.module.scss'

// ── Mock data ────────────────────────────────────────────
const REVENUE_DATA = [
  { month: 'Jan', value: 3200 }, { month: 'Feb', value: 4100 },
  { month: 'Mar', value: 3800 }, { month: 'Apr', value: 5200 },
  { month: 'May', value: 4800 }, { month: 'Jun', value: 5900 },
  { month: 'Jul', value: 6200 }, { month: 'Aug', value: 7100 },
  { month: 'Sep', value: 6800 }, { month: 'Oct', value: 8200 },
  { month: 'Nov', value: 9100 }, { month: 'Dec', value: 10400 },
]

const TRANSACTIONS = [
  { id: 1, name: 'VinMart Supermarket', meta: 'Shopping • May 12, 2024', amount: -124.50, icon: IconShoppingCart, iconBg: '#fff0e0', iconColor: '#f5821f' },
  { id: 2, name: 'Monthly Salary', meta: 'Income • May 05, 2024', amount: 6500.00, icon: IconWallet, iconBg: '#f0fdf4', iconColor: '#16a34a' },
  { id: 3, name: 'EVN Electricity Bill', meta: 'Utility • May 02, 2024', amount: -45.20, icon: IconBolt, iconBg: '#eff6ff', iconColor: '#2563eb' },
]

const QUICK_TRANSFER = [
  { name: 'Anna', color: 'pink' },
  { name: 'David', color: 'blue' },
  { name: 'Linh', color: 'green' },
]

const STAT_SPARKLINE = {
  balance:  [3200, 4100, 3800, 5200, 4800, 5900, 6200, 7100, 8200, 9100],
  income:   [4000, 4200, 3900, 5100, 5400, 5800, 6100, 7200, 7900, 8400],
  expenses: [3800, 3600, 3900, 3500, 3200, 3100, 2900, 3200, 3000, 3120],
}

// Minimal sparkline via SVG path
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const w = 100, h = 40, pad = 2
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = pad + ((1 - (v - min) / (max - min || 1)) * (h - pad * 2))
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} className={styles.statChart}>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Component ────────────────────────────────────────────
export function HomePage() {
  const [period, setPeriod] = useState('Monthly')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Stat cards ── */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {/* Total Balance */}
        <Card withBorder radius="md" p={0}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Balance</div>
            <div className={styles.statValue}>$45,280.00</div>
            <div className={`${styles.statChange} ${styles.up}`}>
              <IconArrowUpRight size={14} /> +2.5% vs last month
            </div>
            <Sparkline data={STAT_SPARKLINE.balance} color="#2563eb" />
          </div>
        </Card>

        {/* Monthly Income */}
        <Card withBorder radius="md" p={0}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Monthly Income</div>
            <div className={styles.statValue}>$8,400.00</div>
            <div className={`${styles.statChange} ${styles.up}`}>
              <IconArrowUpRight size={14} /> +12.1% from bonus
            </div>
            <Sparkline data={STAT_SPARKLINE.income} color="#f5821f" />
          </div>
        </Card>

        {/* Monthly Expenses */}
        <Card withBorder radius="md" p={0}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Monthly Expenses</div>
            <div className={styles.statValue}>$3,120.45</div>
            <div className={`${styles.statChange} ${styles.down}`}>
              <IconArrowDownRight size={14} /> -4.3% reduction
            </div>
            <Sparkline data={STAT_SPARKLINE.expenses} color="#9ca3af" />
          </div>
        </Card>
      </SimpleGrid>

      {/* ── Main row ── */}
      <Grid gutter="md">
        {/* Left: Revenue chart + Transactions */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Revenue chart */}
            <Paper withBorder radius="md" className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <span className={styles.chartTitle}>Monthly Revenue Overview</span>
                <SegmentedControl
                  size="xs"
                  value={period}
                  onChange={setPeriod}
                  data={['Monthly', 'Yearly']}
                />
              </div>
              <AreaChart
                h={220}
                data={REVENUE_DATA}
                dataKey="month"
                series={[{ name: 'value', color: '#2563eb', label: 'Revenue' }]}
                curveType="monotone"
                gridAxis="y"
                withDots
                dotProps={{ r: 3, fill: '#2563eb' }}
                fillOpacity={0.15}
                xAxisProps={{ tick: { fontSize: 11 } }}
                yAxisProps={{ tick: { fontSize: 11 }, tickFormatter: (v: number) => `$${(v / 1000).toFixed(0)}k` }}
              />
            </Paper>

            {/* Recent Transactions */}
            <Paper withBorder radius="md" className={styles.txCard}>
              <div className={styles.txHeader}>
                <span className={styles.sectionTitle}>Recent Transactions</span>
                <Anchor size="sm" c="#f5821f" fw={600}>View All</Anchor>
              </div>
              {TRANSACTIONS.map(({ id, name, meta, amount, icon: Icon, iconBg, iconColor }) => (
                <div key={id} className={styles.txItem}>
                  <div className={styles.txIcon} style={{ background: iconBg }}>
                    <Icon size={18} color={iconColor} />
                  </div>
                  <div className={styles.txInfo}>
                    <div className={styles.txName}>{name}</div>
                    <div className={styles.txMeta}>{meta}</div>
                  </div>
                  <div className={`${styles.txAmount} ${amount < 0 ? styles.negative : styles.positive}`}>
                    {amount < 0 ? '-' : '+'}${Math.abs(amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </Paper>
          </div>
        </Grid.Col>

        {/* Right: Quick Actions + VIB Card + Quick Transfer */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Quick Actions */}
            <Paper withBorder radius="md" className={styles.quickCard}>
              <div className={styles.sectionTitle}>Quick Actions</div>

              <div className={`${styles.actionItem} ${styles.primary}`}>
                <div className={styles.actionIcon} style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <IconTransfer size={18} color="#fff" />
                </div>
                <div>
                  <div className={styles.actionTitle}>Transfer</div>
                  <div className={styles.actionDesc}>Send money instantly</div>
                </div>
              </div>

              <div className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: '#fff7ed' }}>
                  <IconCreditCard size={18} color="#f5821f" />
                </div>
                <div>
                  <div className={styles.actionTitle}>Pay Bills</div>
                  <div className={styles.actionDesc}>Utilities & services</div>
                </div>
              </div>

              <div className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: '#f0fdf4' }}>
                  <IconWallet size={18} color="#16a34a" />
                </div>
                <div>
                  <div className={styles.actionTitle}>Top Up</div>
                  <div className={styles.actionDesc}>Mobile & e-wallet</div>
                </div>
              </div>
            </Paper>

            {/* VIB Platinum Card */}
            <div className={styles.vibCard}>
              <div className={styles.vibCardTop}>
                <div>
                  <div className={styles.vibCardType}>Card Holder</div>
                  <div className={styles.vibCardName}>VIB Platinum</div>
                </div>
                <Badge color="orange" variant="light" size="xs">Platinum</Badge>
              </div>
              <div className={styles.vibCardNumber}>•••• •••• •••• 8829</div>
              <div className={styles.vibCardFooter}>
                <div>
                  <div className={styles.vibCardField}>Card Holder</div>
                  <div className={styles.vibCardValue}>LE MINH HOANG</div>
                </div>
                <div>
                  <div className={styles.vibCardField}>Expiry</div>
                  <div className={styles.vibCardValue}>12/28</div>
                </div>
              </div>
            </div>

            {/* Quick Transfer */}
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="sm">Quick Transfer</Text>
              </Group>
              <div className={styles.transferRow}>
                <div className={styles.transferAvatar}>
                  <ActionIcon size={40} radius="xl" variant="light" color="gray">
                    <IconPlus size={16} />
                  </ActionIcon>
                  <span>Add</span>
                </div>
                {QUICK_TRANSFER.map(({ name, color }) => (
                  <div key={name} className={styles.transferAvatar}>
                    <Avatar size={40} radius="xl" color={color}>{name[0]}</Avatar>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </Paper>
          </div>
        </Grid.Col>
      </Grid>
    </div>
  )
}
