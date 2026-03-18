import { useState } from 'react'
import { ActionIcon, Checkbox, Popover, ScrollArea, Stack, Text } from '@mantine/core'
import { IconChevronDown, IconX } from '@tabler/icons-react'
import styles from './checkbox-select.module.scss'

export interface CheckboxSelectOption {
  value: string
  label: string
}

interface CheckboxSelectProps {
  data: CheckboxSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function CheckboxSelect({
  data,
  value,
  onChange,
  placeholder = 'Select…',
  className,
}: CheckboxSelectProps) {
  const [opened, setOpened] = useState(false)

  const selectedLabels = data.filter((d) => value.includes(d.value)).map((d) => d.label)

  const displayText =
    value.length === 0 ? '' : value.length === 1 ? selectedLabels[0] : `${value.length} selected`

  function toggle(val: string) {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val])
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange([])
  }

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      withinPortal
      shadow="sm"
      offset={2}
    >
      <Popover.Target>
        <div
          className={`${styles.trigger} ${className ?? ''} ${opened ? styles.triggerOpen : ''}`}
          onClick={() => setOpened((o) => !o)}
          role="combobox"
          aria-expanded={opened}
        >
          <span className={value.length ? styles.value : styles.placeholder}>
            {displayText || placeholder}
          </span>
          {value.length > 0 ? (
            <ActionIcon
              size={16}
              variant="transparent"
              color="gray"
              className={styles.icon}
              onClick={clear}
              aria-label="Clear"
            >
              <IconX size={10} />
            </ActionIcon>
          ) : (
            <IconChevronDown
              size={12}
              className={`${styles.icon} ${styles.chevron} ${opened ? styles.chevronOpen : ''}`}
            />
          )}
        </div>
      </Popover.Target>

      <Popover.Dropdown p={0} className={styles.dropdown}>
        {data.length === 0 ? (
          <Text size="xs" c="dimmed" p="sm">
            No options
          </Text>
        ) : (
          <ScrollArea.Autosize mah={220}>
            <Stack gap={0}>
              {data.map((item) => (
                <label key={item.value} className={styles.option}>
                  <Checkbox
                    size="xs"
                    checked={value.includes(item.value)}
                    onChange={() => toggle(item.value)}
                    label={item.label}
                    classNames={{ root: styles.checkboxRoot, label: styles.checkboxLabel }}
                  />
                </label>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Popover.Dropdown>
    </Popover>
  )
}
