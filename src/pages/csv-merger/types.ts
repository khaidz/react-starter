export type ColFormatType =
  | 'text'
  | 'number'
  | 'integer'
  | 'decimal2'
  | 'percentage'
  | 'date_dmy'
  | 'date_ymd'
  | 'datetime'

export const COL_FORMAT_OPTIONS: { value: ColFormatType; label: string; example: string }[] = [
  { value: 'text',       label: 'Text',              example: 'abc' },
  { value: 'number',     label: 'Number',             example: '1234.5' },
  { value: 'integer',    label: 'Integer',            example: '1,234' },
  { value: 'decimal2',   label: 'Decimal (2 places)', example: '1,234.56' },
  { value: 'percentage', label: 'Percentage',         example: '12.5%' },
  { value: 'date_dmy',   label: 'Date (DD/MM/YYYY)',  example: '31/12/2024' },
  { value: 'date_ymd',   label: 'Date (YYYY-MM-DD)',  example: '2024-12-31' },
  { value: 'datetime',   label: 'Date + Time',        example: '31/12/2024 14:30' },
]

export interface CsvFile {
  id: string
  name: string
  sheetName: string
  headers: string[]
  rows: string[][]
  rowCount: number
  colFormats: Record<number, ColFormatType>
}
