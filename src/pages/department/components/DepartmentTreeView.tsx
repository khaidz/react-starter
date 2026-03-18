import type { DepartmentTreeNode } from '@/types/api'
import { ActionIcon, Badge, Box, Button, Group, Loader, Text, TextInput, Tooltip } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import type React from 'react'
import styles from '../department.module.scss'

export function filterTree(nodes: DepartmentTreeNode[], keyword: string): DepartmentTreeNode[] {
  if (!keyword) return nodes
  const kw = keyword.toLowerCase()

  function matchNode(node: DepartmentTreeNode): DepartmentTreeNode | null {
    const selfMatch =
      node.name.toLowerCase().includes(kw) || node.code.toLowerCase().includes(kw)

    if (selfMatch) return node

    const filteredChildren = node.children
      .map(matchNode)
      .filter((n): n is DepartmentTreeNode => n !== null)

    if (filteredChildren.length > 0) return { ...node, children: filteredChildren }

    return null
  }

  return nodes.map(matchNode).filter((n): n is DepartmentTreeNode => n !== null)
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <>{text}</>
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>{text.slice(idx, idx + keyword.length)}</mark>
      {text.slice(idx + keyword.length)}
    </>
  )
}

interface TreeNodeRowProps {
  node: DepartmentTreeNode
  isLast: boolean
  parentPrefix: string
  keyword: string
  onEdit: (id: string) => void
  onDelete: (node: DepartmentTreeNode) => void
  deletePending: boolean
}

function TreeNodeRow({ node, isLast, parentPrefix, keyword, onEdit, onDelete, deletePending }: TreeNodeRowProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  const connector = isLast ? '└─' : '├─'
  const childPrefix = parentPrefix + (isLast ? '   ' : '│  ')

  return (
    <>
      <div className={styles.treeRow}>
        <div className={styles.treeIndent}>
          <span className={styles.treePrefix}>
            {parentPrefix}
            {connector}
          </span>
          {hasChildren ? (
            <ActionIcon
              size={16}
              variant="subtle"
              color="gray"
              onClick={() => setExpanded((v) => !v)}
              className={styles.expandBtn}
            >
              {expanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
            </ActionIcon>
          ) : (
            <span className={styles.leafDot} />
          )}
        </div>

        <div className={styles.treeContent}>
          <Text size="sm" fw={500} style={{ flex: 1 }}>
            <HighlightText text={node.name} keyword={keyword} />
          </Text>
          <Text size="xs" ff="monospace" c="dimmed" w={90}>
            <HighlightText text={node.code} keyword={keyword} />
          </Text>
          {node.ownerUsername && (
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              @<HighlightText text={node.ownerUsername} keyword={keyword} />
            </Text>
          )}
          <Badge size="xs" variant="light" color={node.isActive ? 'green' : 'gray'} w={58} style={{ flexShrink: 0 }}>
            {node.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label="Edit" withArrow>
              <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onEdit(node.id)}>
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon size="sm" variant="subtle" color="red" loading={deletePending} onClick={() => onDelete(node)}>
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              isLast={idx === node.children.length - 1}
              parentPrefix={childPrefix}
              keyword={keyword}
              onEdit={onEdit}
              onDelete={onDelete}
              deletePending={deletePending}
            />
          ))}
        </div>
      )}
    </>
  )
}

export interface DepartmentTreeViewProps {
  treeRoot: DepartmentTreeNode | null
  isLoading: boolean
  isFetching: boolean
  onRefresh: () => void
  onAdd: () => void
  onEdit: (id: string) => void
  onDelete: (node: DepartmentTreeNode) => void
  deletePending: boolean
  viewToggle: React.ReactNode
}

export function DepartmentTreeView({
  treeRoot,
  isLoading,
  isFetching,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
  deletePending,
  viewToggle,
}: DepartmentTreeViewProps) {
  const [search, setSearch] = useState('')
  const [keyword] = useDebouncedValue(search, 1000)

  const topNodes: DepartmentTreeNode[] = treeRoot?.children ?? (treeRoot ? [treeRoot] : [])
  const visibleNodes = useMemo(() => filterTree(topNodes, keyword), [topNodes, keyword])

  return (
    <div className={styles.treeWrapper}>
      <div className={styles.treeToolbar}>
        <div className={styles.treeToolbarLeft}>
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={onAdd}>
            Add New
          </Button>
          <TextInput
            size="xs"
            placeholder="Search name or code..."
            leftSection={<IconSearch size={13} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={200}
          />
        </div>
        <div className={styles.treeToolbarRight}>
          <Tooltip label="Refresh" withArrow position="left">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onRefresh}
              loading={isFetching && !isLoading}
              aria-label="Refresh"
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          {viewToggle}
        </div>
      </div>

      <div className={styles.treeBody}>
        {isLoading ? (
          <div className={styles.treeState}>
            <Loader size="sm" color="vibBlue" />
          </div>
        ) : visibleNodes.length === 0 ? (
          <div className={styles.treeState}>
            <Text size="sm" c="dimmed">
              {search ? 'No departments match your search' : 'No departments found'}
            </Text>
          </div>
        ) : (
          <Box p="md">
            {visibleNodes.map((node, idx) => (
              <TreeNodeRow
                key={node.id}
                node={node}
                isLast={idx === visibleNodes.length - 1}
                parentPrefix=""
                keyword={keyword}
                onEdit={onEdit}
                onDelete={onDelete}
                deletePending={deletePending}
              />
            ))}
          </Box>
        )}
      </div>
    </div>
  )
}
