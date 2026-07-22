import type { ReactNode } from 'react'
import { TEMPLATE_FOOTER, TEMPLATE_FONT, type TemplateAccent } from './prismTemplateTheme'

/** Shared Prism Templates chrome for studio previews (matches printable pack). */
export function PrismMaterialChrome({
  accent,
  subtitle,
  children,
  bw = false,
}: {
  accent: TemplateAccent
  subtitle?: string
  children: ReactNode
  bw?: boolean
}) {
  const c = bw ? '#111111' : accent.c
  const titleColor = bw ? '#111111' : accent.title
  return (
    <div
      className="prism-mat-page flex flex-col rounded-[26px] border-[6px] bg-white p-4 sm:p-5"
      style={{ borderColor: c, fontFamily: TEMPLATE_FONT, color: '#111' }}
    >
      <h3
        className="m-0 text-[22px] font-black tracking-tight sm:text-[26px]"
        style={{ color: titleColor }}
      >
        {accent.label}
      </h3>
      <p
        className="mb-4 mt-1 text-[11px] font-bold uppercase tracking-[0.04em] sm:text-xs"
        style={{ color: bw ? '#444' : '#6b7280' }}
      >
        {subtitle || accent.subtitle}
      </p>
      <div className="flex-1">{children}</div>
      <p
        className="mt-4 pt-2 text-center text-[10px] font-bold tracking-[3px]"
        style={{ color: '#9ca3af' }}
      >
        {TEMPLATE_FOOTER}
      </p>
    </div>
  )
}
