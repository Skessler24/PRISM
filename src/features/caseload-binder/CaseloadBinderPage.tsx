import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { loadSoapNotes } from '../../lib/session-notes/store'
import { loadExitTickets, loadProbeSessions } from '../../lib/progress-monitoring/store'
import { loadGameState } from '../../lib/motivation-game/store'
import { loadParentContacts } from '../../lib/parent-contacts/store'
import { loadPlanner } from '../../lib/weekly-planner/store'
import {
  ALL_BINDER_SECTIONS,
  downloadCaseloadBinderPdf,
  type BinderSection,
} from '../../lib/caseload-binder/generatePdf'
import { readSuiteMode } from '../../lib/templates/catalog'

const SECTION_META: { id: BinderSection; label: string; hint: string }[] = [
  { id: 'roster', label: 'Caseload roster', hint: 'Programs, services, due dates' },
  { id: 'contacts', label: 'Parent / contact log', hint: 'Digital contacts + blank lines' },
  { id: 'progress', label: 'Progress / gradebook', hint: 'Probes + exit tickets' },
  { id: 'planner', label: 'Weekly planner', hint: 'Filled from Weekly Planner tab' },
  { id: 'motivation', label: 'Motivation / attendance', hint: 'Points, board, prizes' },
]

export function CaseloadBinderPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [sections, setSections] = useState<BinderSection[]>([...ALL_BINDER_SECTIONS])
  const [studentId, setStudentId] = useState('')

  const planner = loadPlanner()
  const sessions = loadProbeSessions()
  const tickets = loadExitTickets()
  const soap = loadSoapNotes()
  const game = loadGameState()
  const contacts = loadParentContacts()

  const preview = useMemo(
    () => ({
      sessions: sessions.length,
      tickets: tickets.length,
      soap: soap.length,
      contacts: contacts.length,
      plannerSlots: planner.slots.length,
      gameStudents: game.students.length,
    }),
    // localStorage snapshots — re-read counts when caseload size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students.length],
  )

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  function toggle(id: BinderSection) {
    setSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function buildInput(extraSections?: BinderSection[]) {
    const secs = extraSections || sections
    return {
      districtName: profile.name,
      providerName: 'Caseload provider',
      suiteMode: readSuiteMode(),
      students,
      soapNotes: loadSoapNotes(),
      sessions: loadProbeSessions(),
      tickets: loadExitTickets(),
      game: loadGameState(),
      parentContacts: loadParentContacts(),
      planner: loadPlanner(),
      sections: secs,
      studentId: studentId || undefined,
    }
  }

  function runDownload(extraSections?: BinderSection[]) {
    const secs = extraSections || sections
    if (!secs.length) {
      flash('Pick at least one section')
      return
    }
    if (studentId && !students.some((s) => s.id === studentId)) {
      flash('Pick a valid student')
      return
    }
    setBusy(true)
    try {
      downloadCaseloadBinderPdf(buildInput(secs))
      flash(
        studentId
          ? 'Student packet PDF downloaded'
          : `PDF downloaded (${secs.length} section${secs.length === 1 ? '' : 's'})`,
      )
    } catch (e) {
      flash(e instanceof Error ? e.message : 'PDF failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell
      title="📁 Print Center"
      description="Paper twin of PRISM — whole Caseload Binder, selective sections, or a single-student packet. Weekly Planner slots fill the planner pages. FERPA: generated in-browser only."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <section className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Sections to include</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SECTION_META.map((s) => (
            <label
              key={s.id}
              className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--slate)] px-3 py-2 text-xs"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={sections.includes(s.id)}
                onChange={() => toggle(s.id)}
              />
              <span>
                <strong>{s.label}</strong>
                <span className="block text-[10px] text-[var(--subtext)]">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-semibold"
            onClick={() => setSections([...ALL_BINDER_SECTIONS])}
          >
            Select all
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-semibold"
            onClick={() => setSections([])}
          >
            Clear
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Scope</h2>
        <label className="mt-2 block text-xs font-semibold">
          Whole caseload or one student
          <select
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--border)] px-2 py-2"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Entire caseload</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Students', value: studentId ? 1 : students.length },
            { label: 'Probes', value: preview.sessions },
            { label: 'Exit tickets', value: preview.tickets },
            { label: 'Contacts', value: preview.contacts },
            { label: 'Planner slots', value: preview.plannerSlots },
            { label: 'SOAP', value: preview.soap },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-[var(--border)] p-3 text-center">
              <p className="font-mono text-xl font-bold text-[var(--accent)]">{c.value}</p>
              <p className="text-[10px] text-[var(--subtext)]">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !students.length}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() => runDownload()}
          >
            {busy ? 'Building PDF…' : studentId ? 'Download selected (this student)' : 'Download selected sections'}
          </button>
          <button
            type="button"
            disabled={busy || !students.length}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold disabled:opacity-60"
            onClick={() => {
              setBusy(true)
              try {
                downloadCaseloadBinderPdf({
                  ...buildInput([...ALL_BINDER_SECTIONS]),
                  studentId: undefined,
                  sections: [...ALL_BINDER_SECTIONS],
                })
                flash('Whole Caseload Binder downloaded')
              } catch (e) {
                flash(e instanceof Error ? e.message : 'PDF failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            Whole Caseload Binder
          </button>
          <button
            type="button"
            disabled={busy || !studentId}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() =>
              runDownload(['studentPacket', 'roster', 'progress', 'contacts', 'planner'])
            }
          >
            Single-student packet
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[var(--subtext)]">
          FERPA: PDF stays in your browser. Companion: enter official records in {profile.iepSystem}.
          Planner pages use live Weekly Planner data ({preview.plannerSlots} slots).
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link to="/planner" className="font-semibold text-[var(--accent)]">
            Weekly Planner →
          </Link>
          <Link to="/contacts" className="font-semibold text-[var(--accent)]">
            Parent Contact Log →
          </Link>
          <Link to="/progress" className="font-semibold text-[var(--accent)]">
            Progress Monitoring →
          </Link>
          <Link to="/meeting-prep" className="font-semibold text-[var(--accent)]">
            Meeting Prep →
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
