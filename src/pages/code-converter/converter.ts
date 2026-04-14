// ── Shared helpers ──────────────────────────────────────────────────────────

function splitGenericArgs(s: string): string[] {
  const args: string[] = []
  let depth = 0, cur = ''
  for (const ch of s) {
    if (ch === '<') { depth++; cur += ch }
    else if (ch === '>') { depth--; cur += ch }
    else if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = '' }
    else cur += ch
  }
  if (cur.trim()) args.push(cur.trim())
  return args
}

/** Split "List<Map<K,V>> fieldName" → ["List<Map<K,V>>", "fieldName"] */
function splitTypeAndName(s: string): [string, string] | null {
  let depth = 0, lastSpace = -1
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '<') depth++
    else if (s[i] === '>') depth--
    else if (s[i] === ' ' && depth === 0) lastSpace = i
  }
  if (lastSpace === -1) return null
  const type = s.slice(0, lastSpace).trim()
  const name = s.slice(lastSpace + 1).trim()
  if (!name.match(/^\w+$/) || !type) return null
  return [type, name]
}

// ── Java → TypeScript ────────────────────────────────────────────────────────

const JAVA_TO_TS: Record<string, string> = {
  String: 'string',
  Integer: 'number', int: 'number',
  Long: 'number', long: 'number',
  Double: 'number', double: 'number',
  Float: 'number', float: 'number',
  Short: 'number', short: 'number',
  Byte: 'number', byte: 'number',
  BigDecimal: 'number', BigInteger: 'number', Number: 'number',
  Boolean: 'boolean', boolean: 'boolean',
  Character: 'string', char: 'string',
  Date: 'string', LocalDate: 'string',
  LocalDateTime: 'string', ZonedDateTime: 'string',
  OffsetDateTime: 'string', Instant: 'string',
  UUID: 'string',
  Object: 'unknown', void: 'void', Void: 'void',
}

const LIST_TYPES = new Set(['List', 'ArrayList', 'LinkedList', 'Set', 'HashSet', 'TreeSet', 'Collection'])
const MAP_TYPES  = new Set(['Map', 'HashMap', 'LinkedHashMap', 'TreeMap', 'Hashtable'])

function javaTypeToTs(type: string): string {
  type = type.trim()
  if (type.endsWith('[]')) return `${javaTypeToTs(type.slice(0, -2))}[]`
  const gm = type.match(/^(\w+)<(.+)>$/)
  if (gm) {
    const [, outer, inner] = gm
    if (outer === 'Optional') return `${javaTypeToTs(inner)} | null`
    if (LIST_TYPES.has(outer))  return `${javaTypeToTs(inner)}[]`
    if (MAP_TYPES.has(outer)) {
      const [k, ...rest] = splitGenericArgs(inner)
      return `Record<${javaTypeToTs(k)}, ${javaTypeToTs(rest.join(','))}>`
    }
    return `${outer}<${splitGenericArgs(inner).map(javaTypeToTs).join(', ')}>`
  }
  return JAVA_TO_TS[type] ?? type
}

export interface JavaToTsOptions {
  outputAs: 'interface' | 'type'
  addExport: boolean
  allOptional: boolean
}

export function convertJavaToTs(code: string, opts: JavaToTsOptions): string {
  const cleaned = code
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  const classMatch = cleaned.match(/(?:class|record)\s+(\w+)/)
  if (!classMatch) return '// Could not find class or record declaration'
  const className = classMatch[1]

  const bodyStart = cleaned.indexOf('{')
  const bodyEnd   = cleaned.lastIndexOf('}')
  if (bodyStart === -1) return '// Could not find class body'
  const body = cleaned.slice(bodyStart + 1, bodyEnd === -1 ? undefined : bodyEnd)

  const fields: { name: string; tsType: string; optional: boolean }[] = []

  for (const rawLine of body.split('\n')) {
    let s = rawLine.trim()
    if (!s || s.startsWith('@') || s.startsWith('//') || s.startsWith('*')) continue

    s = s.replace(/@\w+(?:\([^)]*\))?\s*/g, '')  // remove inline annotations
    s = s.replace(/\b(public|private|protected|static|final|transient|volatile|synchronized)\b\s*/g, '')
    s = s.replace(/\s*=\s*[^;]+/, '').replace(/;$/, '').replace(/\{[^}]*\}/, '').trim()
    if (!s) continue

    const result = splitTypeAndName(s)
    if (!result) continue
    const [javaType, name] = result
    if (!name.match(/^[a-z_$]/)) continue   // skip non-field names (methods, constructors)

    const isOptional = javaType.startsWith('Optional<')
    const innerType  = isOptional ? javaType.replace(/^Optional<(.+)>$/, '$1') : javaType
    fields.push({ name, tsType: javaTypeToTs(innerType), optional: isOptional })
  }

  if (fields.length === 0)
    return '// No fields found\n// Tip: make sure fields have access modifiers (private/public)'

  const prefix     = opts.addExport ? 'export ' : ''
  const fieldLines = fields.map(f => `  ${f.name}${f.optional || opts.allOptional ? '?' : ''}: ${f.tsType};`).join('\n')

  return opts.outputAs === 'interface'
    ? `${prefix}interface ${className} {\n${fieldLines}\n}`
    : `${prefix}type ${className} = {\n${fieldLines}\n}`
}

// ── TypeScript → Java ────────────────────────────────────────────────────────

export type NumberType = 'Long' | 'Double' | 'Integer'

function tsTypeToJava(type: string, numType: NumberType): string {
  type = type.trim()

  // T | null  /  T | undefined
  const nullableM = type.match(/^(.+?)\s*\|\s*(?:null|undefined)$/)
  if (nullableM) return `Optional<${tsTypeToJava(nullableM[1].trim(), numType)}>`

  // T[]
  if (type.endsWith('[]')) return `List<${tsTypeToJava(type.slice(0, -2), numType)}>`

  // Array<T>
  const arrM = type.match(/^Array<(.+)>$/)
  if (arrM) return `List<${tsTypeToJava(arrM[1], numType)}>`

  // Record<K, V>
  const recM = type.match(/^Record<(.+),\s*(.+)>$/)
  if (recM) return `Map<${tsTypeToJava(recM[1], numType)}, ${tsTypeToJava(recM[2], numType)}>`

  // { [key: string]: V }
  const idxM = type.match(/^\{\s*\[.*?\]\s*:\s*(.+)\s*\}$/)
  if (idxM) return `Map<String, ${tsTypeToJava(idxM[1], numType)}>`

  const map: Record<string, string> = {
    string: 'String', boolean: 'Boolean',
    number: numType, unknown: 'Object',
    any: 'Object', void: 'void',
    never: 'void', object: 'Object',
  }
  return map[type] ?? type
}

export interface TsToJavaOptions {
  useLombok: boolean
  numberType: NumberType
  useRecord: boolean
}

export function convertTsToJava(code: string, opts: TsToJavaOptions): string {
  const cleaned = code
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  const nameMatch = cleaned.match(/(?:export\s+)?(?:interface|type)\s+(\w+)/)
  if (!nameMatch) return '// Could not find interface or type declaration'
  const name = nameMatch[1]

  const bodyStart = cleaned.indexOf('{')
  const bodyEnd   = cleaned.lastIndexOf('}')
  if (bodyStart === -1) return '// Could not find body'
  const body = cleaned.slice(bodyStart + 1, bodyEnd === -1 ? undefined : bodyEnd)

  const fields: { name: string; javaType: string }[] = []

  for (const rawLine of body.split('\n')) {
    const s = rawLine.trim().replace(/[;,]$/, '').trim()
    if (!s || s.startsWith('//')) continue
    const match = s.match(/^(\w+)(\?)?\s*:\s*(.+)$/)
    if (!match) continue
    fields.push({ name: match[1], javaType: tsTypeToJava(match[3].trim(), opts.numberType) })
  }

  if (fields.length === 0) return '// No fields found'

  if (opts.useRecord) {
    const params = fields.map(f => `    ${f.javaType} ${f.name}`).join(',\n')
    return `public record ${name}(\n${params}\n) {}`
  }

  const lines: string[] = []
  if (opts.useLombok) lines.push('@Data', '@Builder', '@NoArgsConstructor', '@AllArgsConstructor')
  lines.push(`public class ${name} {`)
  fields.forEach(f => lines.push(`    private ${f.javaType} ${f.name};`))
  lines.push('}')
  return lines.join('\n')
}
