import { useMemo, useState } from 'react'
import { Loader, Table, Text } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'
import styles from './data-table.module.scss'

export type SortOrder = 'asc' | 'desc'

export interface TableColumn<T> {
  /** Unique key — also used as sort key */
  key: string
  title: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  /** Required: define how to render a cell */
  render: (row: T) => React.ReactNode
  /** Required when sortable + no onSort (internal sort): return a comparable value */
  sortValue?: (row: T) => string | number
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  /** Field used as React key for each row */
  keyField: keyof T
  loading?: boolean
  emptyText?: string
  /** Pass for server-side / controlled sort */
  sortBy?: string
  sortOrder?: SortOrder
  onSort?: (key: string, order: SortOrder) => void
  /** Slot rendered below the table (e.g. pagination) */
  footer?: React.ReactNode
}

export function DataTable<T extends object>({
  columns,
  data,
  keyField,
  loading = false,
  emptyText = 'Không có dữ liệu',
  sortBy: controlledSortBy,
  sortOrder: controlledSortOrder,
  onSort,
  footer,
}: DataTableProps<T>) {
  const isControlled = !!onSort

  // Internal sort state — only used when onSort is not provided
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null)
  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>('asc')

  const activeSortBy = isControlled ? (controlledSortBy ?? null) : internalSortBy
  const activeSortOrder = isControlled ? (controlledSortOrder ?? 'asc') : internalSortOrder

  function handleSort(key: string) {
    const newOrder: SortOrder =
      activeSortBy === key && activeSortOrder === 'asc' ? 'desc' : 'asc'

    if (isControlled) {
      onSort!(key, newOrder)
    } else {
      setInternalSortBy(key)
      setInternalSortOrder(newOrder)
    }
  }

  const sortedData = useMemo(() => {
    if (isControlled || !internalSortBy) return data
    const col = columns.find((c) => c.key === internalSortBy)
    if (!col?.sortValue) return data
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return internalSortOrder === 'asc' ? cmp : -cmp
    })
  }, [data, isControlled, internalSortBy, internalSortOrder, columns])

  return (
    <div className={styles.wrapper}>
      <div className={styles.scrollArea}>
        <Table className={styles.table} highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th
                  key={col.key}
                  style={{
                    width: col.width,
                    minWidth: col.minWidth,
                    textAlign: col.align ?? 'left',
                  }}
                  className={col.sortable ? styles.thSortable : ''}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className={styles.thInner}>
                    {col.title}
                    {col.sortable && (
                      <span className={`${styles.sortIcon} ${activeSortBy === col.key ? styles.sortActive : ''}`}>
                        {activeSortBy === col.key ? (
                          activeSortOrder === 'asc' ? (
                            <IconChevronUp size={13} />
                          ) : (
                            <IconChevronDown size={13} />
                          )
                        ) : (
                          <IconSelector size={13} />
                        )}
                      </span>
                    )}
                  </span>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} className={styles.stateCell}>
                  <Loader size="sm" color="vibBlue" />
                </Table.Td>
              </Table.Tr>
            ) : sortedData.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} className={styles.stateCell}>
                  <Text size="sm" c="dimmed">{emptyText}</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              sortedData.map((row) => (
                <Table.Tr key={String(row[keyField])}>
                  {columns.map((col) => (
                    <Table.Td
                      key={col.key}
                      style={{ textAlign: col.align ?? 'left' }}
                    >
                      {col.render(row)}
                    </Table.Td>
                  ))}
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
