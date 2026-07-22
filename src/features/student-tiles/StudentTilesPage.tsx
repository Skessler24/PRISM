import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { daysUntil, statusBadgeClass } from '../../lib/students/normalizeStudent'
import type { Student } from '../../lib/students/types'
import { studentsFromArrCsv } from '../../lib/students/arrImport'
import {
  mergeEnrichIntoCaseload,
  parseEnrichSnapshotFiles,
} from '../../lib/students/enrichSnapshotImport'
import { materialsForStudent, type SavedMaterial } from '../../lib/classroom-materials/store'
import { downloadMaterialPdf } from '../../lib/classroom-materials/generateMaterialPdf'
import {
  loadFbaSessions,
  openFbaSessions,
  startFbaForStudent,
} from '../../lib/fba/store'
import { studentInitials } from '../../lib/students/display'

const FILTERS = ['All', 'IEP', '504', 'MLL', 'SLP', 'OT', 'Behavior', 'Academic'] as const

function matchesFilter(s: Student, filter: string) {
  if (filter === 'All') return true
  if (filter === 'IEP') return s.hasIEP
  if (filter === '504') return s.has504
  if (filter === 'MLL') return s.hasMLL
  return s.discipline.includes(filter) || s.disability === filter
}

function StudentCard({
  student: s,
  materials,
  openFba,
  onOpen,
}: {
  student: Student
  materials: SavedMaterial[]
  openFba: boolean
  onOpen: () => void
}) {
  const dueDate = s.hasIEP ? s.iepDue : s.has504 ? s.section504Due : ''
  const dueLabel = s.hasIEP ? 'IEP Due' : s.has504 ? '504 Review' : 'Due'
  const days = daysUntil(dueDate || undefined)
  const dayLabel = days == null ? '—' : `${days}d`

  return (
    <article
      className="cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card transition hover:border-[var(--accent)]"
      style={{ borderTop: `4px solid ${s.color}` }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen()
      }}
      role="button"
      tabIndex={0}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-slate-800"
          style={{ background: s.color }}
        >
          {studentInitials(s.name)}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text)]">{s.name}</p>
          <p className="text-xs text-[var(--subtext)]">
            {s.grade} · {s.teacher}
            {s.caseManager ? ` · ${s.caseManager}` : ''}
          </p>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {s.hasIEP && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
            IEP
          </span>
        )}
        {s.has504 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            504
          </span>
        )}
        {s.hasMLL && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
            MLL
          </span>
        )}
        {materials.length > 0 && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
            {materials.length} materials
          </span>
        )}
        {openFba && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-900">
            Open FBA
          </span>
        )}
        {s.discipline.map((d) => (
          <span
            key={d}
            className="rounded-full bg-[var(--sky)] px-2 py-0.5 text-[10px] font-semibold text-slate-700"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-[var(--subtext)]">
            {dueLabel}: {dueDate || '—'}
          </p>
          <p className="mt-0.5 text-xs">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(s.status)}`}>
              {s.status}
            </span>{' '}
            <span className="font-mono text-[10px] text-[var(--subtext)]">{dayLabel}</span>
          </p>
        </div>
      </div>
    </article>
  )
}

type ToastKind = 'ok' | 'err' | 'info'

export function StudentTilesPage() {
  const { students, restoreDemo, setStudents } = useStudents()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [toastKind, setToastKind] = useState<ToastKind>('info')
  const [importBusy, setImportBusy] = useState(false)
  const [, bump] = useState(0)
  const csvRef = useRef<HTMLInputElement>(null)
  const enrichRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<number | null>(null)

  const selectedId = searchParams.get('id')

  function flash(msg: string, kind: ToastKind = 'info') {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToastKind(kind)
    setToast(msg)
    toastTimer.current = window.setTimeout(() => setToast(''), kind === 'err' ? 7000 : 5000)
  }

  function openStudent(id: string) {
    bump((n) => n + 1)
    setSearchParams({ id }, { replace: true })
  }

  function closeStudent() {
    setSearchParams({}, { replace: true })
  }

  async function onArrCsv(file: File) {
    if (!/\.csv$/i.test(file.name) && !/csv/i.test(file.type)) {
      flash(`Expected a .csv file — got “${file.name}”`, 'err')
      return
    }
    try {
      const text = await file.text()
      if (!text.trim()) {
        flash('CSV file is empty — pick the ARR Special Pops export', 'err')
        return
      }
      const imported = studentsFromArrCsv(text)
      setStudents(imported)
      flash(
        `ARR CSV OK — imported ${imported.length} students from “${file.name}” (this browser only, not uploaded to Azure)`,
        'ok',
      )
    } catch (err) {
      flash(
        `ARR CSV failed: ${err instanceof Error ? err.message : 'Could not parse file'} — check header row has Name, Case Manager, Grade`,
        'err',
      )
    }
  }

  async function onEnrichPdfs(files: FileList | File[]) {
    const list = [...files].filter((f) => /\.pdf$/i.test(f.name))
    const skipped = [...files].length - list.length
    if (!list.length) {
      flash(
        'Enrich import needs PDF Snapshot file(s) — other file types were skipped',
        'err',
      )
      return
    }
    setImportBusy(true)
    try {
      const parsed = await parseEnrichSnapshotFiles(list)
      if (!parsed.length) {
        flash(
          `No student profiles found in ${list.length} PDF(s)${skipped ? ` (${skipped} non-PDF skipped)` : ''} — use Enrich Snapshot exports`,
          'err',
        )
        return
      }
      const mergeMode =
        students.some((s) => s.source === 'demo') && students.every((s) => s.source === 'demo')
          ? 'enrich-only'
          : 'merge'
      // If only demo data, replace with Enrich; otherwise enrich existing ARR/caseload
      const result = mergeEnrichIntoCaseload(
        students,
        parsed,
        mergeMode === 'enrich-only' ? 'enrich-only' : 'merge',
      )
      setStudents(result.students)
      flash(
        `Enrich PDFs OK — ${result.parsed} profiles · +${result.added} added · ${result.updated} updated (browser only)${skipped ? ` · ${skipped} non-PDF skipped` : ''}`,
        'ok',
      )
    } catch (err) {
      flash(
        `Enrich PDF failed: ${err instanceof Error ? err.message : 'Could not read PDF'} — file issue, not AI`,
        'err',
      )
    } finally {
      setImportBusy(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter((s) => {
      if (!matchesFilter(s, filter)) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        (s.caseManager || '').toLowerCase().includes(q) ||
        (s.teacher || '').toLowerCase().includes(q) ||
        (s.homeLanguage || '').toLowerCase().includes(q) ||
        (s.lasid || '').includes(q)
      )
    })
  }, [students, filter, search])

  const selected = students.find((s) => s.id === selectedId) || null
  const shelf = selected ? materialsForStudent(selected.id) : []
  const fbaOpen = selected
    ? loadFbaSessions().some((f) => f.studentId === selected.id && f.open)
    : false
  const openFbaIds = new Set(openFbaSessions().map((f) => f.studentId))

  return (
    <PageShell
      title="🧩 Student Tiles"
      description="Individual student data walls — import ARR CSV + Enrich Snapshot PDFs (browser only), materials, and start FBA sessions. Real caseloads never leave this browser (FERPA)."
    >
      {toast && (
        <div
          role="status"
          className={`mb-3 rounded-lg px-3 py-2 text-xs font-semibold ${
            toastKind === 'ok'
              ? 'bg-emerald-600 text-white'
              : toastKind === 'err'
                ? 'bg-rose-700 text-white'
                : 'bg-[var(--accent)] text-white'
          }`}
        >
          {toast}
        </div>
      )}
      {selectedId && !selected ? (
        <div className="mb-3 rounded-lg tint-sun px-3 py-2 text-xs font-semibold">
          No student found for id <code>{selectedId}</code>.{' '}
          <button type="button" className="text-[var(--accent)] underline" onClick={closeStudent}>
            Clear
          </button>
        </div>
      ) : null}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--subtext)]">
          {filtered.length} of {students.length} students
          {students.some((s) => s.source === 'demo') ? ' · demo caseload' : ''}
          {students.some((s) => s.source === 'arr-csv') ? ' · ARR CSV' : ''}
          {students.some((s) => s.source === 'enrich-snapshot') ? ' · Enrich snapshots' : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
            onClick={() => csvRef.current?.click()}
          >
            Import ARR CSV
          </button>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onArrCsv(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            disabled={importBusy}
            onClick={() => enrichRef.current?.click()}
          >
            {importBusy ? 'Reading PDFs…' : 'Import Enrich Snapshots'}
          </button>
          <input
            ref={enrichRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void onEnrichPdfs(e.target.files)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
            onClick={() => {
              if (confirm('Restore fictional demo students in this browser?')) restoreDemo()
            }}
          >
            Restore Demo
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--subtext)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Search name, teacher, case manager, language…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--subtext)]">No students match. Clear filters or restore demo.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              materials={materialsForStudent(s.id)}
              openFba={openFbaIds.has(s.id)}
              onOpen={() => openStudent(s.id)}
            />
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[1100] flex justify-end bg-black/40"
          onClick={closeStudent}
          role="presentation"
        >
          <aside
            className="flex h-full w-full max-w-md flex-col bg-[var(--card-bg)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-tile-title"
          >
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-slate-800"
                  style={{ background: selected.color }}
                >
                  {studentInitials(selected.name)}
                </div>
                <div className="min-w-0">
                  <h2 id="student-tile-title" className="font-heading text-lg font-bold leading-tight">
                    {selected.name}
                  </h2>
                  <p className="text-xs text-[var(--subtext)]">
                    {selected.grade || 'Grade —'}
                    {selected.teacher ? ` · ${selected.teacher}` : ''}
                    {selected.caseManager ? ` · CM ${selected.caseManager}` : ''}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selected.hasIEP && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                        IEP
                      </span>
                    )}
                    {selected.has504 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        504
                      </span>
                    )}
                    {selected.hasMLL && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                        MLL
                      </span>
                    )}
                    {selected.hasBip && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-900">
                        BIP
                      </span>
                    )}
                    {selected.discipline.map((d) => (
                      <span
                        key={d}
                        className="rounded-full bg-[var(--sky)] px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                      >
                        {d}
                      </span>
                    ))}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(selected.status)}`}
                    >
                      {selected.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-semibold"
                onClick={closeStudent}
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <section className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
                  Profile
                </p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                      Disability
                    </dt>
                    <dd className="font-medium text-[var(--text)]">
                      {selected.disability && selected.disability !== '—'
                        ? selected.disability
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                      Provider
                    </dt>
                    <dd className="font-medium text-[var(--text)]">{selected.provider || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                      IEP due
                    </dt>
                    <dd className="font-medium text-[var(--text)]">
                      {selected.iepDue || '—'}
                      {selected.hasIEP && selected.iepDue
                        ? ` (${daysUntil(selected.iepDue) ?? '—'}d)`
                        : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                      Re-eval
                    </dt>
                    <dd className="font-medium text-[var(--text)]">{selected.reevalDue || '—'}</dd>
                  </div>
                  {selected.has504 && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                        504 review
                      </dt>
                      <dd className="font-medium text-[var(--text)]">
                        {selected.section504Due || '—'}
                      </dd>
                    </div>
                  )}
                  {selected.meetingDate && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                        Meeting
                      </dt>
                      <dd className="font-medium text-[var(--text)]">{selected.meetingDate}</dd>
                    </div>
                  )}
                  {selected.lasid && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                        LASID
                      </dt>
                      <dd className="font-mono text-[11px] text-[var(--text)]">{selected.lasid}</dd>
                    </div>
                  )}
                  {selected.homeLanguage && (
                    <div>
                      <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                        Home language
                      </dt>
                      <dd className="font-medium text-[var(--text)]">
                        {selected.homeLanguage}
                        {selected.interpreterNeeded ? ' · interpreter' : ''}
                      </dd>
                    </div>
                  )}
                  <div className="col-span-2">
                    <dt className="text-[10px] font-semibold uppercase text-[var(--subtext)]">
                      Source
                    </dt>
                    <dd className="font-medium text-[var(--text)]">{selected.source}</dd>
                  </div>
                </dl>
                {(selected.interests || selected.triggers || selected.calming) && (
                  <div className="mt-3 space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--slate)] p-3 text-xs">
                    {selected.interests ? (
                      <p>
                        <strong>Interests:</strong> {selected.interests}
                      </p>
                    ) : null}
                    {selected.triggers ? (
                      <p>
                        <strong>Triggers:</strong> {selected.triggers}
                      </p>
                    ) : null}
                    {selected.calming ? (
                      <p>
                        <strong>Calming:</strong> {selected.calming}
                      </p>
                    ) : null}
                  </div>
                )}
              </section>

              <section className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
                  Materials shelf
                </p>
                {!shelf.length && (
                  <p className="mb-3 text-xs text-[var(--subtext)]">
                    No materials yet.{' '}
                    <Link to="/templates" className="font-semibold text-[var(--accent)]">
                      Create in Materials Studio →
                    </Link>
                  </p>
                )}
                <ul className="mb-1 space-y-2">
                  {shelf.map((m) => (
                    <li key={m.id} className="rounded-xl border border-[var(--border)] p-3 text-xs">
                      <strong>
                        {m.title} · {m.kind}
                      </strong>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link
                          to={`/materials/session/${m.id}`}
                          className="rounded bg-emerald-600 px-2 py-1 font-semibold text-white"
                        >
                          Smart TV
                        </Link>
                        <button
                          type="button"
                          className="rounded border border-[var(--border)] px-2 py-1 font-semibold"
                          onClick={() => downloadMaterialPdf(m, 'letter')}
                        >
                          PDF
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
                  FBA / behavior
                </p>
                {fbaOpen ? (
                  <div className="mb-1 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs">
                    <p className="font-semibold">Open FBA session</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        to={`/fba?session=${loadFbaSessions().find((f) => f.studentId === selected.id && f.open)?.id || ''}`}
                        className="font-semibold text-[var(--accent)]"
                      >
                        Open FBA sheet →
                      </Link>
                      <button
                        type="button"
                        className="rounded bg-emerald-600 px-2 py-1 font-semibold text-white"
                        onClick={() => {
                          const sid = loadFbaSessions().find(
                            (f) => f.studentId === selected.id && f.open,
                          )?.id
                          if (sid)
                            window.open(
                              `/fba/tally/${sid}`,
                              'prism-fba-tally',
                              'width=420,height=640',
                            )
                        }}
                      >
                        +/- tally pop-out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-1 rounded-xl border border-[var(--border)] bg-[var(--slate)] p-3 text-xs">
                    <p className="mb-2 text-[var(--subtext)]">No open FBA for this student yet.</p>
                    <button
                      type="button"
                      className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white"
                      onClick={() => {
                        const sess = startFbaForStudent(selected.id, selected.name)
                        bump((n) => n + 1)
                        navigate(`/fba?session=${sess.id}`)
                      }}
                    >
                      Start FBA for {selected.name.split(' ')[0]}
                    </button>
                  </div>
                )}
              </section>

              <section className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
                  Goals &amp; accommodations
                </p>
                {selected.goals.length > 0 ? (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-[var(--text)]">
                      Goals ({selected.goals.length})
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[var(--subtext)]">
                      {selected.goals.slice(0, 8).map((g) => (
                        <li key={g.slice(0, 48)}>{g}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mb-3 text-xs text-[var(--subtext)]">
                    Goals: — not on this record yet. Import Enrich Snapshot PDFs to pull goals into
                    the tile (ARR CSV alone usually has dates/services, not goal text).
                  </p>
                )}
                {selected.accommodations.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--text)]">
                      Accommodations ({selected.accommodations.length})
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[var(--subtext)]">
                      {selected.accommodations.slice(0, 8).map((a) => (
                        <li key={a.slice(0, 48)}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--subtext)]">Accommodations: —</p>
                )}
              </section>

              <section className="mb-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
                  Jump to
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    to={`/caseload?tab=soap&student=${encodeURIComponent(selected.id)}`}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 font-semibold"
                  >
                    Caseload / SOAP
                  </Link>
                  <Link
                    to="/scheduling"
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 font-semibold"
                  >
                    Scheduling
                  </Link>
                  <Link
                    to="/progress"
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 font-semibold"
                  >
                    Progress
                  </Link>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </PageShell>
  )
}
