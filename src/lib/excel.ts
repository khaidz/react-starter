import * as XLSX from 'xlsx'
import type { CsvFile, ColFormatType } from '@/pages/csv-merger/types'

export const NUM_FMT: Record<ColFormatType, string> = {
  text:       '@',
  number:     '#,##0.##',
  integer:    '#,##0',
  decimal2:   '#,##0.00',
  percentage: '0.00%',
  date_dmy:   'dd/mm/yyyy',
  date_ymd:   'yyyy-mm-dd',
  datetime:   'dd/mm/yyyy hh:mm',
}

export function applyFormats(ws: XLSX.WorkSheet, file: CsvFile) {
  if (Object.keys(file.colFormats).length === 0) return

  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let ri = range.s.r + 1; ri <= range.e.r; ri++) {
    for (const [colStr, fmt] of Object.entries(file.colFormats)) {
      const ci = Number(colStr)
      const cellAddr = XLSX.utils.encode_cell({ r: ri, c: ci })
      const cell: XLSX.CellObject = ws[cellAddr]
      if (!cell) continue

      const raw = String(cell.v ?? '')

      if (fmt === 'text') {
        cell.t = 's'
        cell.v = raw
      } else if (fmt === 'integer' || fmt === 'number' || fmt === 'decimal2') {
        const n = parseFloat(raw.replace(/,/g, ''))
        if (!isNaN(n)) { cell.t = 'n'; cell.v = n; cell.z = NUM_FMT[fmt] }
      } else if (fmt === 'percentage') {
        const n = parseFloat(raw.replace('%', '').replace(/,/g, ''))
        if (!isNaN(n)) {
          cell.t = 'n'
          cell.v = Math.abs(n) > 1 ? n / 100 : n
          cell.z = NUM_FMT[fmt]
        }
      } else if (fmt === 'date_dmy' || fmt === 'date_ymd' || fmt === 'datetime') {
        const epoch = new Date(1899, 11, 30).getTime()
        let d = new Date(raw)
        // Fallback: try as Excel serial number
        if (isNaN(d.getTime())) {
          const serial = parseFloat(raw)
          if (!isNaN(serial) && serial > 1) d = new Date(epoch + serial * 86400000)
        }
        if (!isNaN(d.getTime())) {
          const serial = (d.getTime() - epoch) / 86400000
          cell.t = 'n'; cell.v = serial; cell.z = NUM_FMT[fmt]
        }
      }
    }
  }
}

export function buildWorksheet(file: CsvFile): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([file.headers, ...file.rows])
  applyFormats(ws, file)
  return ws
}

export function sanitizeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]]/g, '_').slice(0, 31)
}
