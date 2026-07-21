import { jsPDF } from 'jspdf'
import type { SavedMaterial, CommPayload, SchedulePayload, TokenPayload, BehaviorPayload } from './store'

/** Print / laminate sizes — large formats scale content for poster printers. */
export type PrintSizeId =
  | 'letter'
  | 'tabloid'
  | 'poster18x24'
  | 'poster24x36'
  | 'poster36x48'

export const PRINT_SIZES: { id: PrintSizeId; label: string; wIn: number; hIn: number }[] = [
  { id: 'letter', label: 'Letter 8.5×11″ (laminate)', wIn: 8.5, hIn: 11 },
  { id: 'tabloid', label: 'Tabloid 11×17″', wIn: 11, hIn: 17 },
  { id: 'poster18x24', label: 'Poster 18×24″', wIn: 18, hIn: 24 },
  { id: 'poster24x36', label: 'Poster 24×36″', wIn: 24, hIn: 36 },
  { id: 'poster36x48', label: 'Banner / poster 36×48″', wIn: 36, hIn: 48 },
]

function sizeMm(id: PrintSizeId) {
  const s = PRINT_SIZES.find((x) => x.id === id) || PRINT_SIZES[0]
  return { w: s.wIn * 25.4, h: s.hIn * 25.4, label: s.label }
}

export function downloadMaterialPdf(material: SavedMaterial, sizeId: PrintSizeId = 'letter') {
  const { w, h, label } = sizeMm(sizeId)
  const doc = new jsPDF({ unit: 'mm', format: [w, h], orientation: h >= w ? 'portrait' : 'landscape' })
  const margin = Math.min(14, w * 0.04)
  let y = margin + 8

  doc.setFillColor(30, 64, 120)
  doc.rect(0, 0, w, Math.min(22, h * 0.08), 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(Math.max(14, Math.min(28, w * 0.05)))
  doc.text('PRISM Classroom Material', margin, margin + 4)
  doc.setFontSize(Math.max(9, Math.min(14, w * 0.025)))
  doc.text(`${material.title} · ${material.studentName || 'Caseload'} · ${label}`, margin, margin + 12)
  doc.setTextColor(40, 40, 40)
  y = Math.min(28, h * 0.1) + 6

  const titleSize = Math.max(16, Math.min(36, w * 0.06))
  doc.setFontSize(titleSize)
  doc.setFont('helvetica', 'bold')
  doc.text(material.title, margin, y)
  y += titleSize * 0.6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(Math.max(10, Math.min(18, w * 0.03)))

  if (material.kind === 'token') {
    const p = material.payload as TokenPayload
    doc.text(`Working for: ${p.reward}`, margin, y)
    y += 12
    const cols = Math.min(p.tokenCount, 5)
    const cell = Math.min((w - margin * 2) / cols - 4, 40)
    for (let i = 0; i < p.tokenCount; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = margin + col * (cell + 4)
      const yy = y + row * (cell + 6)
      doc.setDrawColor(100)
      doc.circle(x + cell / 2, yy + cell / 2, cell / 2.4, 'S')
      doc.setFontSize(10)
      doc.text(String(i + 1), x + cell / 2 - 2, yy + cell / 2 + 2)
    }
  } else if (material.kind === 'schedule') {
    const p = material.payload as SchedulePayload
    doc.text(`${p.scheduleType}`, margin, y)
    y += 10
    for (let i = 0; i < p.steps.length; i++) {
      const boxH = Math.min(22, (h - y - margin) / Math.max(p.steps.length, 1) - 2)
      doc.setDrawColor(60)
      doc.setFillColor(230, 242, 255)
      doc.roundedRect(margin, y, w - margin * 2, boxH, 3, 3, 'FD')
      doc.setFontSize(Math.max(11, Math.min(20, w * 0.035)))
      doc.text(`${i + 1}. ${p.steps[i]}`, margin + 6, y + boxH * 0.62)
      y += boxH + 3
      if (y > h - margin) break
    }
  } else if (material.kind === 'comm') {
    const p = material.payload as CommPayload
    const cells = p.cells.length ? p.cells : ['I want', 'help', 'more', 'stop']
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(cells.length))))
    const rows = Math.ceil(cells.length / cols)
    const cellW = (w - margin * 2) / cols - 3
    const cellH = Math.min(36, (h - y - margin) / rows - 3)
    cells.forEach((word, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = margin + col * (cellW + 3)
      const yy = y + row * (cellH + 3)
      doc.setFillColor(200, 230, 245)
      doc.setDrawColor(40)
      doc.roundedRect(x, yy, cellW, cellH, 4, 4, 'FD')
      doc.setFontSize(Math.max(10, Math.min(22, cellW * 0.18)))
      doc.setFont('helvetica', 'bold')
      const tw = doc.getTextWidth(word)
      doc.text(word, x + (cellW - tw) / 2, yy + cellH * 0.58)
    })
  } else if (material.kind === 'behavior') {
    const p = material.payload as BehaviorPayload
    doc.text(`Target: ${p.targetBehavior}`, margin, y)
    y += 10
    doc.text(`Chart: ${p.chartType} · tally boxes for laminate`, margin, y)
    y += 14
    for (let i = 0; i < 20; i++) {
      const x = margin + (i % 10) * 14
      const yy = y + Math.floor(i / 10) * 16
      doc.rect(x, yy, 10, 10)
    }
  } else {
    const lines = doc.splitTextToSize(material.body || '', w - margin * 2)
    doc.text(lines, margin, y)
  }

  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(
    'PRISM · laminate / poster print · demo or local data only · human review required',
    margin,
    h - 6,
  )

  const safe = material.title.replace(/[^\w.-]+/g, '_').slice(0, 40)
  doc.save(`PRISM-${safe}-${sizeId}.pdf`)
}
