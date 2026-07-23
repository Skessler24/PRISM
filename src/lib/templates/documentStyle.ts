/**
 * IEP document template styling — Claude “Nocturne” design system
 * landed for future form loading. Scoped to document windows / print,
 * not the main PRISM app chrome (Theme Studio still owns the shell).
 */

export const NOCTURNE_STYLE_HREF = '/iep-templates/nocturne/styles.css'
export const NOCTURNE_PRINT_HREF = '/iep-templates/nocturne/print.css'

export type IepDocMeta = {
  title: string
  subtitle?: string
  studentName?: string
  date?: string
  footer?: string
}

/** Escape text for safe HTML injection in document shells. */
export function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function styleLinks(origin?: string): string {
  const base = (origin || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '')
  const styleHref = base ? `${base}${NOCTURNE_STYLE_HREF}` : NOCTURNE_STYLE_HREF
  const printHref = base ? `${base}${NOCTURNE_PRINT_HREF}` : NOCTURNE_PRINT_HREF
  return `<link rel="stylesheet" href="${styleHref}" />
<link rel="stylesheet" href="${printHref}" />`
}

function shellCss(): string {
  return `
  .iep-shell { max-width: 820px; margin: 0 auto; padding: var(--space-8) var(--space-6); }
  .iep-head { margin-bottom: var(--space-6); }
  .iep-kicker { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent); margin: 0 0 var(--space-2); }
  .iep-meta { display: flex; flex-wrap: wrap; gap: var(--space-4); font-size: 13px; opacity: 0.75; margin-top: var(--space-3); }
  .iep-body {
    white-space: pre-wrap; font-size: 14px; line-height: 1.55;
    padding: var(--space-4); border-radius: var(--radius-md);
    background: var(--color-surface); box-shadow: var(--shadow-sm);
  }
  .iep-actions { display: flex; gap: var(--space-2); margin: var(--space-4) 0; }
  .iep-foot {
    margin-top: var(--space-8); padding-top: var(--space-4);
    font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
    text-align: center; color: color-mix(in srgb, var(--color-text) 45%, transparent);
  }
`
}

/**
 * Wrap a filled Forms Library body in a Nocturne-styled HTML document
 * ready to open / print / save. Plain text is preserved with whitespace.
 */
export function buildIepDocumentHtml(
  body: string,
  meta: IepDocMeta,
  opts?: { origin?: string; inlineCss?: string },
): string {
  const title = escapeHtml(meta.title || 'PRISM IEP Document')
  const subtitle = escapeHtml(meta.subtitle || 'Companion draft — human review required')
  const student = escapeHtml(meta.studentName || '')
  const date = escapeHtml(meta.date || new Date().toISOString().slice(0, 10))
  const footer = escapeHtml(
    meta.footer || '✦ PRISM · Companion draft · paste into Enrich / SoR after review ✦',
  )
  const content = escapeHtml(body).replace(/\n/g, '<br />')
  const styles = opts?.inlineCss
    ? `<style>${opts.inlineCss}\n${shellCss()}</style>`
    : `${styleLinks(opts?.origin)}\n<style>${shellCss()}</style>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
${styles}
</head>
<body>
  <main class="iep-shell">
    <header class="iep-head">
      <p class="iep-kicker">PRISM · IEP Document</p>
      <h1>${title}</h1>
      <p class="text-muted">${subtitle}</p>
      <div class="iep-meta">
        ${student ? `<span>Student: <strong>${student}</strong></span>` : ''}
        <span>Date: ${date}</span>
      </div>
    </header>
    <div class="iep-actions no-print">
      <button type="button" class="btn btn-primary" onclick="window.print()">Print / PDF</button>
      <button type="button" class="btn btn-secondary" onclick="window.close()">Close</button>
    </div>
    <article class="iep-body card elev-sm">${content}</article>
    <footer class="iep-foot">${footer}</footer>
  </main>
</body>
</html>`
}

async function fetchNocturneCss(): Promise<string> {
  const [styles, print] = await Promise.all([
    fetch(NOCTURNE_STYLE_HREF).then((r) => (r.ok ? r.text() : '')),
    fetch(NOCTURNE_PRINT_HREF).then((r) => (r.ok ? r.text() : '')),
  ])
  // Drop Google Fonts @import for offline downloads — Inter may fall back locally.
  const cleaned = styles.replace(/@import url\([^)]+\);\s*/g, '')
  return `${cleaned}\n${print}`
}

/** Open a styled IEP document in a new window (uses live /iep-templates CSS). */
export function openIepDocumentWindow(body: string, meta: IepDocMeta) {
  const html = buildIepDocumentHtml(body, meta, {
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  })
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000')
  if (!win) throw new Error('Pop-up blocked — allow pop-ups to preview styled documents')
  win.document.open()
  win.document.write(html)
  win.document.close()
}

/** Download styled HTML (CSS inlined so the file works offline / SharePoint). */
export async function downloadIepDocumentHtml(body: string, meta: IepDocMeta, filename?: string) {
  let inlineCss = ''
  try {
    inlineCss = await fetchNocturneCss()
  } catch {
    /* fall back to linked styles if fetch fails */
  }
  const html = buildIepDocumentHtml(body, meta, {
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    inlineCss: inlineCss || undefined,
  })
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  const safe = (filename || meta.title || 'prism-iep-doc')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 60)
  a.download = `${safe}.html`
  a.click()
  URL.revokeObjectURL(a.href)
}
