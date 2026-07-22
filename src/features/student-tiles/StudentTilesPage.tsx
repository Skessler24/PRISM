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

export function StudentTilesPage() {
  const { students, restoreDemo, setStudents } = useStudents()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [, bump] = useState(0)
  const csvRef = useRef<HTMLInputElement>(null)
  const enrichRef = useRef<HTMLInputElement>(null)

  const selectedId = searchParams.get('id')

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 4000)
  }

  function openStudent(id: string) {
    bump((n) => n + 1)
    setSearchParams({ id }, { replace: true })
  }

  function closeStudent() {
    setSearchParams({}, { replace: true })
  }

  async function onArrCsv(file: File) {
    try {
      const text = await file.text()
      const imported = studentsFromArrCsv(text)
      setStudents(imported)
      flash(`Imported ${imported.length} students from ARR CSV (this browser only)`)
    } catch (err) {
      flash(err instanceof Error ? err.message : 'CSV import failed')
    }
  }

  async function onEnrichPdfs(files: FileList | File[]) {
    const list = [...files].filter((f) => /\.pdf$/i.test(f.name))
    if (!list.length) {
      flash('Select Enrich Snapshot PDF file(s)')
      return
    }
    setImportBusy(true)
    try {
      const parsed = await parseEnrichSnapshotFiles(list)
      if (!parsed.length) {
        flash('No student profiles found in those PDFs')
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
        `Enrich snapshots: ${result.parsed} profiles · +${result.added} added · ${result.updated} updated (browser only)`,
      )
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Enrich PDF import failed')
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
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
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
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={closeStudent}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-[var(--card-bg)] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-bold">{selected.name}</h2>
                <p className="text-xs text-[var(--subtext)]">
                  {selected.grade} · {selected.disability}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs"
                onClick={closeStudent}
              >
                Close
              </button>
            </div>

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
            <ul className="mb-4 space-y-2">
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

            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
              FBA / behavior
            </p>
            {fbaOpen ? (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs">
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
                        window.open(`/fba/tally/${sid}`, 'prism-fba-tally', 'width=420,height=640')
                    }}
                  >
                    +/- tally pop-out
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--slate)] p-3 text-xs">
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

            {(selected.goals.length > 0 || selected.accommodations.length > 0) && (
              <div className="mb-3 space-y-2 text-[10px] text-[var(--subtext)]">
                {selected.disability && selected.disability !== '—' && (
                  <p>
                    <strong className="text-[var(--text)]">Disability:</strong> {selected.disability}
                  </p>
                )}
                {selected.goals.length > 0 && (
                  <div>
                    <strong className="text-[var(--text)]">Goals</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {selected.goals.slice(0, 4).map((g) => (
                        <li key={g.slice(0, 40)}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.accommodations.length > 0 && (
                  <div>
                    <strong className="text-[var(--text)]">Accommodations</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {selected.accommodations.slice(0, 5).map((a) => (
                        <li key={a.slice(0, 40)}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <p className="text-[10px] text-[var(--subtext)]">
              Goals: {selected.goals.length ? `${selected.goals.length} on file` : '—'}
              {selected.lasid ? ` · LASID ${selected.lasid}` : ''}
            </p>
          </aside>
        </div>
      )}
    </PageShell>
  )
}
