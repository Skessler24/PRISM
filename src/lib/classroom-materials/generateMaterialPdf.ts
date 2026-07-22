import { jsPDF } from 'jspdf'
import type {
  SavedMaterial,
  CommPayload,
  SchedulePayload,
  TokenPayload,
  BehaviorPayload,
  SocialPayload,
} from './store'
import {
  TEMPLATE_FOOTER,
  accentForMaterial,
  fitzColor,
  hexToRgb,
} from './prismTemplateTheme'

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

export type PdfOptions = {
  /** Black & white ink-friendly (matches printable BW pages) */
  bw?: boolean
}

function footer(doc: jsPDF, w: number, h: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text(TEMPLATE_FOOTER, w / 2, h - 8, { align: 'center' })
}

function titleBlock(
  doc: jsPDF,
  accentRgb: [number, number, number],
  title: string,
  subtitle: string,
  margin: number,
  y: number,
) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...accentRgb)
  doc.text(title, margin, y)
  y += 8
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text(subtitle.toUpperCase(), margin, y)
  return y + 10
}

/**
 * PDF output matches Prism Templates printable pack:
 * Nunito-like bold titles, accent borders, numbered slots, ✦ PRISM TEMPLATES ✦ footer.
 */
export function downloadMaterialPdf(
  material: SavedMaterial,
  sizeId: PrintSizeId = 'letter',
  options: PdfOptions = {},
) {
  const { w, h } = sizeMm(sizeId)
  const bw = Boolean(options.bw)
  const scheduleType =
    material.kind === 'schedule' ? (material.payload as SchedulePayload).scheduleType : undefined
  const accent = accentForMaterial(material.kind, scheduleType)
  const accentRgb = bw ? ([17, 17, 17] as [number, number, number]) : hexToRgb(accent.c)
  const titleRgb = bw ? ([17, 17, 17] as [number, number, number]) : hexToRgb(accent.title)

  const doc = new jsPDF({ unit: 'mm', format: [w, h], orientation: h >= w ? 'portrait' : 'landscape' })
  const margin = Math.min(16, w * 0.05)
  let y = margin + 4

  const subtitle = bw
    ? accent.subtitle.replace(/^Color/, 'Black & White')
    : accent.subtitle

  y = titleBlock(doc, titleRgb, accent.label, subtitle, margin, y)

  if (material.studentName) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...titleRgb)
    doc.text(`Name: ${material.studentName}`, margin, y)
    y += 8
  }

  if (material.kind === 'token') {
    const p = material.payload as TokenPayload
    // Header fields box
    doc.setDrawColor(...accentRgb)
    doc.setLineWidth(0.8)
    doc.roundedRect(margin, y, w - margin * 2, 22, 4, 4, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...titleRgb)
    doc.text(`Goal: ${p.goalLabel || p.reward}`, margin + 4, y + 9)
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    doc.text(`Working for: ${p.reward}`, margin + 4, y + 17)
    y += 30

    const cols = Math.min(p.tokenCount, 5)
    const cell = Math.min((w - margin * 2) / cols - 6, 36)
    for (let i = 0; i < p.tokenCount; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = margin + col * (cell + 6) + cell / 2
      const yy = y + row * (cell + 8) + cell / 2
      doc.setDrawColor(...accentRgb)
      doc.setLineWidth(1.2)
      doc.setFillColor(255, 255, 255)
      doc.circle(x, yy, cell / 2.2, 'FD')
      doc.setFontSize(10)
      doc.setTextColor(...accentRgb)
      doc.text(String(i + 1), x, yy + cell / 2.6 - 2, { align: 'center' })
    }
    y += Math.ceil(p.tokenCount / cols) * (cell + 8) + 8

    // Reward circle
    const rx = w / 2
    const ry = Math.min(y + 28, h - 40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...titleRgb)
    doc.text('Reward', rx, ry - 22, { align: 'center' })
    doc.setDrawColor(...accentRgb)
    doc.setLineWidth(1.4)
    doc.circle(rx, ry, 18, 'S')
    doc.setFontSize(28)
    doc.setTextColor(...accentRgb)
    doc.text('★', rx, ry + 4, { align: 'center' })
  } else if (material.kind === 'schedule' && scheduleType === 'First / Then') {
    const p = material.payload as SchedulePayload
    const first = p.steps[0] || ''
    const then = p.steps[1] || ''
    const boxW = (w - margin * 2 - 10) / 2
    const boxH = Math.min(90, h - y - 30)
    doc.setDrawColor(...accentRgb)
    doc.setLineWidth(2.5)
    doc.roundedRect(margin, y, w - margin * 2, boxH + 28, 8, 8, 'S')
    const drawCol = (x: number, label: string, text: string) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(...titleRgb)
      doc.text(label, x + boxW / 2, y + 14, { align: 'center' })
      doc.setDrawColor(17, 17, 17)
      doc.setLineWidth(1)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(x + 6, y + 20, boxW - 12, boxH - 10, 4, 4, 'FD')
      if (text) {
        doc.setFontSize(12)
        doc.setTextColor(17, 17, 17)
        const lines = doc.splitTextToSize(text, boxW - 20)
        doc.text(lines, x + boxW / 2, y + 20 + (boxH - 10) / 2, { align: 'center' })
      }
    }
    drawCol(margin + 6, 'FIRST', first)
    drawCol(margin + 6 + boxW + 4, 'THEN', then)
  } else if (material.kind === 'schedule') {
    const p = material.payload as SchedulePayload
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(p.scheduleType, margin, y)
    y += 8
    for (let i = 0; i < p.steps.length; i++) {
      const boxH = Math.min(18, (h - y - 20) / Math.max(p.steps.length, 1) - 2)
      doc.setDrawColor(...accentRgb)
      doc.setLineWidth(0.7)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, y, w - margin * 2, boxH, 4, 4, 'FD')
      // number circle
      const cy = y + boxH / 2
      doc.setFillColor(...accentRgb)
      if (bw) {
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(17, 17, 17)
        doc.circle(margin + 8, cy, 4.5, 'FD')
        doc.setTextColor(17, 17, 17)
      } else {
        doc.circle(margin + 8, cy, 4.5, 'F')
        doc.setTextColor(255, 255, 255)
      }
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(String(i + 1), margin + 8, cy + 1.2, { align: 'center' })
      doc.setTextColor(17, 17, 17)
      doc.setFontSize(Math.max(10, Math.min(14, w * 0.03)))
      doc.text(p.steps[i], margin + 16, cy + 1.5)
      // check box
      doc.setDrawColor(...accentRgb)
      doc.roundedRect(w - margin - 10, cy - 4, 8, 8, 1, 1, 'S')
      y += boxH + 3
      if (y > h - 22) break
    }
  } else if (material.kind === 'comm') {
    const p = material.payload as CommPayload
    const cells = p.cells.length ? p.cells : ['I want', 'help', 'more', 'stop']
    const cols = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(cells.length))))
    const rows = Math.ceil(cells.length / cols)
    const cellW = (w - margin * 2) / cols - 4
    const cellH = Math.min(42, (h - y - 22) / rows - 4)
    cells.forEach((word, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = margin + col * (cellW + 4)
      const yy = y + row * (cellH + 4)
      const fill = bw ? '#ffffff' : fitzColor(word)
      const [fr, fg, fb] = hexToRgb(fill)
      doc.setFillColor(fr, fg, fb)
      doc.setDrawColor(17, 17, 17)
      doc.setLineWidth(0.8)
      doc.roundedRect(x, yy, cellW, cellH * 0.72, 3, 3, 'FD')
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.5)
      doc.line(x + 4, yy + cellH - 2, x + cellW - 4, yy + cellH - 2)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(Math.max(9, Math.min(16, cellW * 0.16)))
      doc.setTextColor(17, 17, 17)
      const tw = doc.getTextWidth(word)
      doc.text(word, x + (cellW - tw) / 2, yy + cellH * 0.42)
    })
  } else if (material.kind === 'behavior') {
    const p = material.payload as BehaviorPayload
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...titleRgb)
    doc.text(`Target: ${p.targetBehavior}`, margin, y)
    y += 8
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`Chart: ${p.chartType}`, margin, y)
    y += 12
    for (let i = 0; i < 20; i++) {
      const x = margin + (i % 10) * 14
      const yy = y + Math.floor(i / 10) * 16
      doc.setDrawColor(...accentRgb)
      doc.setLineWidth(0.8)
      doc.roundedRect(x, yy, 10, 10, 1.5, 1.5, 'S')
    }
  } else if (material.kind === 'social') {
    const p = material.payload as SocialPayload
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...titleRgb)
    doc.text(p.topic || 'Social story', margin, y)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(17, 17, 17)
    const lines = doc.splitTextToSize(p.story || material.body || '', w - margin * 2)
    doc.text(lines, margin, y)
  } else {
    const lines = doc.splitTextToSize(material.body || '', w - margin * 2)
    doc.setTextColor(17, 17, 17)
    doc.text(lines, margin, y)
  }

  footer(doc, w, h)

  const safe = material.title.replace(/[^\w.-]+/g, '_').slice(0, 40)
  const mode = bw ? 'bw' : 'color'
  doc.save(`PRISM-${safe}-${sizeId}-${mode}.pdf`)
}
