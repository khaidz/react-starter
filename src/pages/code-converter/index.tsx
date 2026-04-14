import { useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowsRightLeft, IconCopy, IconRefreshAlert } from '@tabler/icons-react'
import {
  convertJavaToTs,
  convertTsToJava,
  type JavaToTsOptions,
  type NumberType,
  type TsToJavaOptions,
} from './converter'
import styles from './code-converter.module.scss'

const JAVA_PLACEHOLDER = `@Data
@Builder
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private Boolean active;
    private List<String> roles;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;
}`

const TS_PLACEHOLDER = `export interface UserDto {
  id: number;
  username: string;
  email: string;
  active: boolean;
  roles: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
}`

type Direction = 'java-to-ts' | 'ts-to-java'

export function CodeConverterPage() {
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const [direction, setDirection] = useState<Direction>('java-to-ts')

  // Java → TS options
  const [outputAs,    setOutputAs]    = useState<'interface' | 'type'>('interface')
  const [addExport,   setAddExport]   = useState(true)
  const [allOptional, setAllOptional] = useState(false)

  // TS → Java options
  const [useLombok,  setUseLombok]  = useState(true)
  const [numberType, setNumberType] = useState<NumberType>('Long')
  const [useRecord,  setUseRecord]  = useState(false)

  const handleConvert = () => {
    const input = inputRef.current?.value ?? ''
    if (!input.trim()) {
      notifications.show({ message: 'Please enter some code first', color: 'orange' })
      return
    }

    let result: string
    if (direction === 'java-to-ts') {
      const opts: JavaToTsOptions = { outputAs, addExport, allOptional }
      result = convertJavaToTs(input, opts)
    } else {
      const opts: TsToJavaOptions = { useLombok, numberType, useRecord }
      result = convertTsToJava(input, opts)
    }

    if (outputRef.current) outputRef.current.value = result
  }

  const handleSwap = () => {
    const inputVal  = inputRef.current?.value  ?? ''
    const outputVal = outputRef.current?.value ?? ''
    if (inputRef.current)  inputRef.current.value  = outputVal
    if (outputRef.current) outputRef.current.value = inputVal
    setDirection((d) => d === 'java-to-ts' ? 'ts-to-java' : 'java-to-ts')
  }

  const handleCopy = () => {
    const val = outputRef.current?.value ?? ''
    if (!val) return
    navigator.clipboard.writeText(val)
    notifications.show({ message: 'Copied to clipboard', color: 'green' })
  }

  const inputLabel  = direction === 'java-to-ts' ? 'Java' : 'TypeScript'
  const outputLabel = direction === 'java-to-ts' ? 'TypeScript' : 'Java'
  const placeholder = direction === 'java-to-ts' ? JAVA_PLACEHOLDER : TS_PLACEHOLDER

  return (
    <Paper shadow="xs" radius="md" p="xl" className={styles.container}>
      <Stack gap="lg">

        {/* Title */}
        <div>
          <Text className={styles.pageTitle}>Code Converter</Text>
          <Text className={styles.pageSubtitle}>
            Convert Java classes ↔ TypeScript interfaces
          </Text>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Direction */}
          <SegmentedControl
            value={direction}
            onChange={(v) => setDirection(v as Direction)}
            data={[
              { label: 'Java → TypeScript', value: 'java-to-ts' },
              { label: 'TypeScript → Java', value: 'ts-to-java' },
            ]}
            size="sm"
          />

          {/* Swap */}
          <Tooltip label="Swap input / output">
            <Button size="sm" variant="light" color="gray" leftSection={<IconArrowsRightLeft size={14} />}
              onClick={handleSwap}
            >
              Swap
            </Button>
          </Tooltip>

          {/* Convert */}
          <Button size="sm" leftSection={<IconRefreshAlert size={14} />} onClick={handleConvert}>
            Convert
          </Button>
        </div>

        {/* Options */}
        <div className={styles.options}>
          {direction === 'java-to-ts' ? (
            <Group gap="lg" align="center">
              <Group gap="xs" align="center">
                <Text size="xs" fw={500} c="dimmed">Output as</Text>
                <SegmentedControl
                  size="xs"
                  value={outputAs}
                  onChange={(v) => setOutputAs(v as 'interface' | 'type')}
                  data={[
                    { label: 'interface', value: 'interface' },
                    { label: 'type', value: 'type' },
                  ]}
                />
              </Group>
              <Checkbox
                size="xs"
                label="Add export"
                checked={addExport}
                onChange={(e) => setAddExport(e.currentTarget.checked)}
              />
              <Checkbox
                size="xs"
                label="All fields optional (?)"
                checked={allOptional}
                onChange={(e) => setAllOptional(e.currentTarget.checked)}
              />
            </Group>
          ) : (
            <Group gap="lg" align="center">
              <Checkbox
                size="xs"
                label="Lombok (@Data, @Builder…)"
                checked={useLombok}
                onChange={(e) => setUseLombok(e.currentTarget.checked)}
                disabled={useRecord}
              />
              <Checkbox
                size="xs"
                label="Use record"
                checked={useRecord}
                onChange={(e) => setUseRecord(e.currentTarget.checked)}
              />
              <Group gap="xs" align="center">
                <Text size="xs" fw={500} c="dimmed">number →</Text>
                <Select
                  size="xs"
                  value={numberType}
                  onChange={(v) => v && setNumberType(v as NumberType)}
                  data={['Long', 'Double', 'Integer']}
                  allowDeselect={false}
                  style={{ width: 100 }}
                />
              </Group>
            </Group>
          )}
        </div>

        {/* Editor panels */}
        <Grid gutter="md">
          {/* Input */}
          <Grid.Col span={6}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>{inputLabel}</span>
                <Button size="xs" variant="subtle" color="gray"
                  onClick={() => { if (inputRef.current) inputRef.current.value = '' }}
                >
                  Clear
                </Button>
              </div>
              <Textarea
                ref={inputRef}
                defaultValue=""
                placeholder={placeholder}
                autosize
                minRows={18}
                maxRows={30}
                className={styles.editor}
                styles={{ input: {}, wrapper: {} }}
              />
            </div>
          </Grid.Col>

          {/* Output */}
          <Grid.Col span={6}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>{outputLabel}</span>
                <Tooltip label="Copy to clipboard">
                  <Button size="xs" variant="subtle" color="blue"
                    leftSection={<IconCopy size={13} />}
                    onClick={handleCopy}
                  >
                    Copy
                  </Button>
                </Tooltip>
              </div>
              <Textarea
                ref={outputRef}
                defaultValue=""
                readOnly
                autosize
                minRows={18}
                maxRows={30}
                className={`${styles.editor} ${styles.editorReadonly}`}
                styles={{ input: {}, wrapper: {} }}
              />
            </div>
          </Grid.Col>
        </Grid>

      </Stack>
    </Paper>
  )
}
