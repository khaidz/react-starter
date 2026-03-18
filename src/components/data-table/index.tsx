import { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ActionIcon,
  Checkbox,
  Collapse,
  Loader,
  Popover,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { CheckboxSelect } from '@/components/checkbox-select'
import { IconAdjustmentsHorizontal, IconCheck, IconChevronDown, IconChevronUp, IconCopy, IconFilter, IconFilterOff, IconRefresh, IconSearch, IconSelector } from '@tabler/icons-react'
import styles from './data-table.module.scss'

// ─── Column definition ────────────────────────────────────────────────────────

export interface TableColumn<T> {
  id: string
  header: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  enableSorting?: boolean
  enableColumnFilter?: boolean
  filterPlaceholder?: string
  /** 'select' for single-select dropdown, 'multi-select' for multi-select dropdown */
  filterType?: 'text' | 'select' | 'multi-select'
  filterOptions?: { value: string; label: string }[]
  accessorFn?: (row: T) => string | number
  /** Show copy-to-clipboard icon on hover when cell text is truncated */
  copyable?: boolean
  cell: (row: T) => React.ReactNode
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<T extends object> {
  columns: TableColumn<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  emptyText?: string
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  /**
   * Pass for server-side column filtering (mirrors sorting control pattern).
   * When provided along with onColumnFilterChange, filter row inputs are
   * controlled and no client-side filtering is applied.
   */
  columnFilterValues?: Record<string, string | string[]>
  onColumnFilterChange?: (id: string, value: string | string[]) => void
  toolbar?: React.ReactNode
  toolbarRight?: React.ReactNode
  /** Server-side filter controls shown in a collapsible bar below the toolbar */
  filterBar?: React.ReactNode
  footer?: React.ReactNode
  onRefresh?: () => void
  refreshing?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  columns,
  data,
  keyField,
  loading = false,
  emptyText = 'No data',
  sorting: controlledSorting,
  onSortingChange,
  columnFilterValues,
  onColumnFilterChange,
  toolbar,
  toolbarRight,
  filterBar,
  footer,
  onRefresh,
  refreshing = false,
}: DataTableProps<T>) {
  const isControlledSort = !!onSortingChange
  const isControlledFilter = !!onColumnFilterChange

  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [filterRowVisible, setFilterRowVisible] = useState(false)

  const activeSorting = isControlledSort ? (controlledSorting ?? []) : internalSorting

  const hasFilterRow = columns.some((c) => c.enableColumnFilter)
  const hasFilters = hasFilterRow || !!filterBar

  const hasActiveFilters = isControlledFilter
    ? columnFilterValues != null &&
      Object.values(columnFilterValues).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v)))
    : columnFilters.length > 0

  function handleClearFilters() {
    if (isControlledFilter) {
      columns.forEach((col) => {
        if (col.enableColumnFilter) {
          onColumnFilterChange!(col.id, col.filterType === 'multi-select' ? [] : '')
        }
      })
    } else {
      setColumnFilters([])
    }
  }

  const colMap = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns])

  const columnDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.id,
        header: col.header,
        accessorFn: col.accessorFn ?? (() => ''),
        cell: ({ row }) => col.cell(row.original),
        enableSorting: col.enableSorting ?? false,
        enableColumnFilter: col.enableColumnFilter ?? false,
        meta: {
          width: col.width,
          minWidth: col.minWidth,
          align: col.align ?? 'left',
          filterPlaceholder: col.filterPlaceholder ?? 'Search…',
          filterType: col.filterType ?? 'text',
          filterOptions: col.filterOptions ?? [],
        },
      })),
    [columns],
  )

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: {
      sorting: activeSorting,
      columnFilters,
      columnVisibility,
    },
    manualSorting: isControlledSort,
    manualFiltering: isControlledFilter,
    onSortingChange: isControlledSort
      ? (updater) => {
          const next = typeof updater === 'function' ? updater(activeSorting) : updater
          onSortingChange!(next)
        }
      : setInternalSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isControlledSort ? undefined : getSortedRowModel(),
    getFilteredRowModel: isControlledFilter ? undefined : getFilteredRowModel(),
  })

  const visibleColumns = table.getVisibleLeafColumns()
  const colSpan = visibleColumns.length

  return (
    <div className={styles.wrapper}>
      {/* ── Toolbar ── */}
      {(toolbar || true) && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>{toolbar}</div>
          <div className={styles.toolbarRight}>
            {onRefresh && (
              <Tooltip label="Refresh" withArrow position="left">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={onRefresh}
                  loading={refreshing}
                  aria-label="Refresh"
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {hasFilters && (
              <Tooltip label={filterRowVisible ? 'Hide filters' : 'Show filters'} withArrow position="left">
                <ActionIcon
                  variant={filterRowVisible ? 'light' : 'subtle'}
                  color={filterRowVisible ? 'blue' : 'gray'}
                  onClick={() => setFilterRowVisible((v) => !v)}
                  aria-label="Toggle filter row"
                >
                  <IconFilter size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {hasActiveFilters && (
              <Tooltip label="Clear filters" withArrow position="left">
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={handleClearFilters}
                  aria-label="Clear filters"
                >
                  <IconFilterOff size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <ColumnVisibilityToggle
              columns={columns}
              columnVisibility={columnVisibility}
              onToggle={(id, visible) =>
                setColumnVisibility((prev) => ({ ...prev, [id]: visible }))
              }
            />
            {toolbarRight}
          </div>
        </div>
      )}

      {filterBar && (
        <Collapse in={filterRowVisible}>
          <div className={styles.filterBar}>{filterBar}</div>
        </Collapse>
      )}

      <div className={styles.scrollArea}>
        <Table className={styles.table} highlightOnHover>
          <Table.Thead>
            {/* Sort header row */}
            <Table.Tr>
              {table.getFlatHeaders().filter((h) => h.column.getIsVisible()).map((header) => {
                const meta = header.column.columnDef.meta as any
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()

                return (
                  <Table.Th
                    key={header.id}
                    style={{
                      width: meta?.width,
                      minWidth: meta?.minWidth,
                      textAlign: meta?.align ?? 'left',
                    }}
                    className={canSort ? styles.thSortable : ''}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span className={styles.thInner}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span className={`${styles.sortIcon} ${sorted ? styles.sortActive : ''}`}>
                          {sorted === 'asc' ? (
                            <IconChevronUp size={13} />
                          ) : sorted === 'desc' ? (
                            <IconChevronDown size={13} />
                          ) : (
                            <IconSelector size={13} />
                          )}
                        </span>
                      )}
                    </span>
                  </Table.Th>
                )
              })}
            </Table.Tr>

            {/* Per-column filter row */}
            {hasFilterRow && filterRowVisible && (
              <Table.Tr className={styles.filterRow}>
                {table.getFlatHeaders().filter((h) => h.column.getIsVisible()).map((header) => {
                  const canFilter = header.column.getCanFilter()
                  const meta = header.column.columnDef.meta as any
                  return (
                    <Table.Th key={`filter-${header.id}`} className={styles.filterCell}>
                      {canFilter ? (
                        isControlledFilter ? (
                          meta?.filterType === 'multi-select' ? (
                            <CheckboxSelect
                              data={meta?.filterOptions ?? []}
                              value={(columnFilterValues?.[header.id] as string[]) ?? []}
                              onChange={(v) => onColumnFilterChange!(header.id, v)}
                              placeholder={meta?.filterPlaceholder ?? 'All…'}
                              className={styles.filterInput}
                            />
                          ) : meta?.filterType === 'select' ? (
                            <Select
                              size="xs"
                              placeholder={meta?.filterPlaceholder ?? 'All…'}
                              data={meta?.filterOptions ?? []}
                              value={(columnFilterValues?.[header.id] as string) || null}
                              onChange={(v) => onColumnFilterChange!(header.id, v ?? '')}
                              clearable
                              classNames={{ input: styles.filterInput }}
                            />
                          ) : (
                            <TextInput
                              size="xs"
                              leftSection={<IconSearch size={12} />}
                              placeholder={meta?.filterPlaceholder ?? 'Search…'}
                              value={(columnFilterValues?.[header.id] as string) ?? ''}
                              onChange={(e) => onColumnFilterChange!(header.id, e.currentTarget.value)}
                              classNames={{ input: styles.filterInput }}
                            />
                          )
                        ) : (
                          <DebouncedFilterInput
                            placeholder={meta?.filterPlaceholder ?? 'Search…'}
                            onFilterChange={(value) => header.column.setFilterValue(value || undefined)}
                          />
                        )
                      ) : null}
                    </Table.Th>
                  )
                })}
              </Table.Tr>
            )}
          </Table.Thead>

          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={colSpan} className={styles.stateCell}>
                  <Loader size="sm" color="vibBlue" />
                </Table.Td>
              </Table.Tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={colSpan} className={styles.stateCell}>
                  <Text size="md" c="dimmed">
                    {emptyText}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={String(row.original[keyField])}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as any
                    const colDef = colMap.get(cell.column.id)
                    const tooltipLabel = colDef?.accessorFn
                      ? String(colDef.accessorFn(row.original))
                      : undefined
                    return (
                      <Table.Td key={cell.id} style={{ textAlign: meta?.align ?? 'left' }}>
                        <TooltipCell label={tooltipLabel} copyable={colDef?.copyable}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TooltipCell>
                      </Table.Td>
                    )
                  })}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}

// ─── Tooltip Cell ────────────────────────────────────────────────────────────

function TooltipCell({ children, label: externalLabel, copyable }: { children: React.ReactNode; label?: string; copyable?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [truncated, setTruncated] = useState(false)
  const [domLabel, setDomLabel] = useState('')
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const isTruncated = el.scrollWidth > el.clientWidth
    setTruncated(isTruncated)
    if (!externalLabel && isTruncated) setDomLabel(el.textContent ?? '')
  }, [externalLabel])

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(externalLabel ?? domLabel)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}
      onMouseEnter={() => copyable && setHovered(true)}
      onMouseLeave={() => copyable && setHovered(false)}
    >
      <Tooltip label={externalLabel ?? domLabel} disabled={!truncated} withArrow>
        <div ref={ref} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </Tooltip>
      {copyable && truncated && (
        <ActionIcon
          size="xs"
          variant="subtle"
          color={copied ? 'green' : 'gray'}
          style={{ opacity: hovered ? 1 : 0, flexShrink: 0, transition: 'opacity 0.15s', pointerEvents: hovered ? 'auto' : 'none' }}
          onClick={handleCopy}
        >
          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
        </ActionIcon>
      )}
    </div>
  )
}

// ─── Debounced Filter Input ───────────────────────────────────────────────────

function DebouncedFilterInput({
  placeholder,
  onFilterChange,
  debounce = 1000,
}: {
  placeholder: string
  onFilterChange: (value: string) => void
  debounce?: number
}) {
  const [value, setValue] = useState('')
  const [debounced] = useDebouncedValue(value, debounce)

  useEffect(() => {
    onFilterChange(debounced)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <TextInput
      size="xs"
      leftSection={<IconSearch size={12} />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      classNames={{ input: styles.filterInput }}
    />
  )
}

// ─── Column Visibility Toggle ─────────────────────────────────────────────────

function ColumnVisibilityToggle<T extends object>({
  columns,
  columnVisibility,
  onToggle,
}: {
  columns: TableColumn<T>[]
  columnVisibility: VisibilityState
  onToggle: (id: string, visible: boolean) => void
}) {
  const [opened, setOpened] = useState(false)

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-end" shadow="md" withinPortal>
      <Popover.Target>
        <Tooltip label="Show / hide columns" withArrow position="left">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => setOpened((o) => !o)}
            aria-label="Toggle columns"
          >
            <IconAdjustmentsHorizontal size={16} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown>
        <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase" lts="0.05em">
          Columns
        </Text>
        <Stack gap={6}>
          {columns.map((col) => {
            const isVisible = columnVisibility[col.id] !== false
            return (
              <Checkbox
                key={col.id}
                size="xs"
                label={col.header}
                checked={isVisible}
                onChange={(e) => onToggle(col.id, e.currentTarget.checked)}
              />
            )
          })}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
