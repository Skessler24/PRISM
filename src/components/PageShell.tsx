import { type ReactNode } from 'react'
import { Breadcrumbs } from './Breadcrumbs'

type PageShellProps = {
  title: string
  description: string
  children?: ReactNode
  trail?: { label: string; to?: string }[]
  /** When true, skip the hero header (used inside Creation Station hub). */
  embedded?: boolean
}

export function PageShell({ title, description, children, trail, embedded }: PageShellProps) {
  return (
    <div>
      {!embedded && (
        <>
          <Breadcrumbs trail={trail} />
          <div
            className="mb-4 rounded-2xl border border-[var(--border)] p-4 tint-lav shadow-card"
            style={{ borderTop: '4px solid var(--accent)' }}
          >
            <h1 className="font-heading text-2xl font-bold text-[var(--text)]">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--subtext)]">{description}</p>
          </div>
        </>
      )}
      {embedded && (
        <p className="mb-3 text-xs text-[var(--subtext)]">
          <span className="font-semibold text-[var(--text)]">{title}</span> — {description}
        </p>
      )}
      {children ?? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-[var(--text)]">Shell ready</p>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Content migrates in Prompt 3 — structure and routing only for now.
          </p>
        </div>
      )}
    </div>
  )
}
