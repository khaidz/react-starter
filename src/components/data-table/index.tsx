import { useMemo, useState, useEffect } from 'react'
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
  Loader,
  Popover,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconAdjustmentsHorizontal, IconChevronDown, IconChevronUp, IconFilter, IconRefresh, IconSearch, IconSelector } from '@tabler/icons-react'
import styles from './data-table.module.scss'

// ─── Column definition ────────────────────────────────────────────────────────

export interface TableColumn<T> {
  /** Unique identifier — also used as sort/filter key */
  id: string
  /** Header label */
  header: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  /** Enable clicking header to sort */
  enableSorting?: boolean
  /** Enable per-column search input below header */
  enableColumnFilter?: boolean
  filterPlaceholder?: string
  /**
   * Required when `enableSorting` or `enableColumnFilter` is true.
   * Return the primitive value TanStack uses for sort/filter comparisons.
   */
  accessorFn?: (row: T) => string | number
  /** How to render each cell in the body */
  cell: (row: T) => React.ReactNode
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<T extends object> {
  columns: TableColumn<T>[]
  data: T[]
  /** Field used as React key for each row */
  keyField: keyof T
  loading?: boolean
  emptyText?: string
  /**
   * Pass for server-side / controlled sort.
   * When provided, TanStack sort won't run client-side —
   * you handle it yourself via `onSortingChange`.
   */
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  /** Extra content rendered in the toolbar left (e.g. Add button, export) */
  toolbar?: React.ReactNode
  /** Extra content rendered in the toolbar right, before built-in action icons */
  toolbarRight?: React.ReactNode
  /** Slot rendered below the table (e.g. pagination) */
  footer?: React.ReactNode
  /** Called when user clicks the refresh button; omit to hide the button */
  onRefresh?: () => void
  /** Show spinning indicator on the refresh button */
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
  toolbar,
  toolbarRight,
  footer,
  onRefresh,
  refreshing = false,
}: DataTableProps<T>) {
  const isControlledSort = !!onSortingChange

  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [filterRowVisible, setFilterRowVisible] = useState(false)

  const activeSorting = isControlledSort ? (controlledSorting ?? []) : internalSorting

  const hasFilterRow = columns.some((c) => c.enableColumnFilter)

  // Convert our column definitions → TanStack ColumnDef
  const columnDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.id,
        header: col.header,
        // accessorFn is required for sort/filter; fall back to empty string
        accessorFn: col.accessorFn ?? (() => ''),
        cell: ({ row }) => col.cell(row.original),
        enableSorting: col.enableSorting ?? false,
        enableColumnFilter: col.enableColumnFilter ?? false,
        meta: {
          width: col.width,
          minWidth: col.minWidth,
          align: col.align ?? 'left',
          filterPlaceholder: col.filterPlaceholder ?? 'Search…',
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
    // Sorting
    manualSorting: isControlledSort,
    onSortingChange: isControlledSort
      ? (updater) => {
          const next =
            typeof updater === 'function' ? updater(activeSorting) : updater
          onSortingChange!(next)
        }
      : setInternalSorting,
    // Filtering (always client-side)
    onColumnFiltersChange: setColumnFilters,
    // Visibility
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isControlledSort ? undefined : getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
            {hasFilterRow && (
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

      <div className={styles.scrollArea}>
        <Table className={styles.table} highlightOnHover>
          <Table.Thead>
            {/* Sort header row */}
            <Table.Tr>
              {table.getFlatHeaders().filter((h) => h.column.getIsVisible()).map((header) => {
                const meta = header.column.columnDef.meta as TableColumn<T>['id'] extends string
                  ? {
                      width?: number | string
                      minWidth?: number | string
                      align: 'left' | 'center' | 'right'
                      filterPlaceholder: string
                    }
                  : never
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()

                return (
                  <Table.Th
                    key={header.id}
                    style={{
                      width: (meta as any)?.width,
                      minWidth: (meta as any)?.minWidth,
                      textAlign: (meta as any)?.align ?? 'left',
                    }}
                    className={canSort ? styles.thSortable : ''}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span className={styles.thInner}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span
                          className={`${styles.sortIcon} ${sorted ? styles.sortActive : ''}`}
                        >
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
                        <DebouncedFilterInput
                          placeholder={meta?.filterPlaceholder ?? 'Search…'}
                          onFilterChange={(value) => header.column.setFilterValue(value || undefined)}
                        />
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
                    return (
                      <Table.Td
                        key={cell.id}
                        style={{ textAlign: meta?.align ?? 'left' }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

// ─── Debounced Filter Input ───────────────────────────────────────────────────

function DebouncedFilterInput({
  placeholder,
  onFilterChange,
  debounce = 300,
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
