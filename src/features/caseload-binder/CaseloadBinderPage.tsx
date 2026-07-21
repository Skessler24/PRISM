import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { loadSoapNotes } from '../../lib/session-notes/store'
import { loadExitTickets, loadProbeSessions } from '../../lib/progress-monitoring/store'
import { loadGameState } from '../../lib/motivation-game/store'
import { downloadCaseloadBinderPdf } from '../../lib/caseload-binder/generatePdf'
import { readSuiteMode } from '../../lib/templates/catalog'

export function CaseloadBinderPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const preview = useMemo(() => {
    const sessions = loadProbeSessions()
    const tickets = loadExitTickets()
    const soap = loadSoapNotes()
    const game = loadGameState()
    return {
      sessions: sessions.length,
      tickets: tickets.length,
      soap: soap.length,
      gameStudents: game.students.length,
    }
    // Recompute when caseload size changes (localStorage counts otherwise stale after navigation)
  }, [students.length])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  function download() {
    setBusy(true)
    try {
      downloadCaseloadBinderPdf({
        districtName: profile.name,
        providerName: 'Caseload provider',
        suiteMode: readSuiteMode(),
        students,
        soapNotes: loadSoapNotes(),
        sessions: loadProbeSessions(),
        tickets: loadExitTickets(),
        game: loadGameState(),
      })
      flash('PDF downloaded — paper version of your caseload toolkit')
    } catch (e) {
      flash(e instanceof Error ? e.message : 'PDF failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell
      title="📁 Caseload Binder"
      description="Download a polished PDF binder: roster, parent log pages, progress/gradebook snapshot, weekly planner, and motivation/attendance — a paper twin of your PRISM caseload."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">What&apos;s included</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
          <li>Caseload roster (programs, services, due dates)</li>
          <li>Parent / contact log (blank lines + recent SOAP dates)</li>
          <li>Progress / gradebook snapshot from Progress Monitoring probes & exit tickets</li>
          <li>Weekly planner pages (Mon–Fri)</li>
          <li>Motivation game points, attendance, and prize board</li>
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: 'Students', value: students.length },
            { label: 'Probe sessions', value: preview.sessions },
            { label: 'Exit tickets', value: preview.tickets },
            { label: 'SOAP notes', value: preview.soap },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-[var(--border)] p-3 text-center">
              <p className="font-mono text-xl font-bold text-[var(--accent)]">{c.value}</p>
              <p className="text-[10px] text-[var(--subtext)]">{c.label}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={busy || !students.length}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          onClick={download}
        >
          {busy ? 'Building PDF…' : 'Download whole Caseload Binder (PDF)'}
        </button>
        <p className="mt-2 text-[10px] text-[var(--subtext)]">
          FERPA: PDF is generated in your browser from local data — never uploaded. Companion: still
          enter official records in {profile.iepSystem}.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link to="/progress" className="font-semibold text-[var(--accent)]">
            Progress Monitoring →
          </Link>
          <Link to="/caseload" className="font-semibold text-[var(--accent)]">
            Caseload / SOAP →
          </Link>
          <Link to="/game" className="font-semibold text-[var(--accent)]">
            Motivation Game →
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
