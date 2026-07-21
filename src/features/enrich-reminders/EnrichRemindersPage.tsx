import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { daysUntil } from '../../lib/students/normalizeStudent'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import {
  formatChecklistForEnrich,
  getOrCreateChecklist,
  loadReminderChecklists,
  saveReminderChecklists,
  type ReminderChecklist,
} from '../../lib/enrich-reminders/store'

export function EnrichRemindersPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const sequence = useMemo(
    () => profile.rules.enrichFinalizeSequence || [],
    [profile.rules.enrichFinalizeSequence],
  )
  const nomDays = profile.rules.nomLeadTimeDays
  const [list, setList] = useState<ReminderChecklist[]>(() => loadReminderChecklists())
  const [studentId, setStudentId] = useState('')
  const [toast, setToast] = useState('')

  const checklist = useMemo(() => {
    if (!studentId) return null
    return getOrCreateChecklist(list, studentId, sequence)
  }, [list, studentId, sequence])

  const student = students.find((s) => s.id === studentId)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function persist(next: ReminderChecklist) {
    const out = [...list.filter((c) => c.studentId !== next.studentId), { ...next, updatedAt: new Date().toISOString() }]
    setList(out)
    saveReminderChecklists(out)
  }

  function toggleStep(step: string) {
    if (!checklist) return
    const today = new Date().toISOString().slice(0, 10)
    const done = checklist.steps[step]
    persist({
      ...checklist,
      steps: { ...checklist.steps, [step]: done ? '' : today },
    })
  }

  function copyChecklist() {
    if (!checklist || !student) return
    void navigator.clipboard.writeText(
      formatChecklistForEnrich(student.name, checklist, sequence, profile.iepSystem),
    )
    flash('Checklist copied — paste into Enrich notes')
  }

  const meetingWatch = students
    .filter((s) => s.meetingDate)
    .map((s) => {
      const d = daysUntil(s.meetingDate)
      const rem = list.find((c) => c.studentId === s.id)
      return { s, d, nomSent: rem?.nomSentDate || '' }
    })
    .filter((x) => x.d != null && x.d >= 0 && x.d <= nomDays + 14)
    .sort((a, b) => (a.d ?? 99) - (b.d ?? 99))

  return (
    <PageShell
      title="📨 Enrich Reminders"
      description={`Companion workflow for ${profile.iepSystem}: checklists, NOM lead time (${nomDays} calendar days), and Copy — never a live sync.`}
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}
      <FieldTip tipId="eval-checklist" className="mb-3" />

      <section className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Upcoming meetings / NOM watch</h2>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          Legal NOM must be sent from {profile.iepSystem} ≥{nomDays} calendar days before the meeting.
        </p>
        <ul className="mt-3 space-y-2 text-xs">
          {!meetingWatch.length && (
            <li className="text-[var(--subtext)]">No meetings with dates in the next few weeks.</li>
          )}
          {meetingWatch.map(({ s, d, nomSent }) => (
            <li
              key={s.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                (d ?? 99) <= nomDays && !nomSent
                  ? 'border-red-200 bg-red-50'
                  : 'border-[var(--border)] bg-[var(--slate)]'
              }`}
            >
              <span>
                <strong>{s.name}</strong> · meeting {s.meetingDate} ({d}d)
                {nomSent ? ` · NOM logged ${nomSent}` : ' · NOM not logged in PRISM'}
              </span>
              <button
                type="button"
                className="font-semibold text-[var(--accent)]"
                onClick={() => setStudentId(s.id)}
              >
                Open checklist →
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <label className="text-xs font-semibold">
          Student checklist
          <select
            className="mt-1 w-full max-w-md rounded-lg border border-[var(--border)] px-2 py-2"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Select…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {checklist && student && (
          <>
            <label className="mt-3 block text-xs font-semibold">
              NOM sent date (document in {profile.iepSystem})
              <input
                type="date"
                className="mt-1 w-full max-w-xs rounded-lg border border-[var(--border)] px-2 py-2"
                value={checklist.nomSentDate}
                onChange={(e) => persist({ ...checklist, nomSentDate: e.target.value })}
              />
            </label>

            <h3 className="mt-4 text-xs font-bold">
              {profile.iepSystem} finalize sequence
            </h3>
            <ul className="mt-2 space-y-2">
              {sequence.map((step) => {
                const done = Boolean(checklist.steps[step])
                return (
                  <li key={step}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs ${
                        done
                          ? 'border-green-200 bg-green-50'
                          : 'border-[var(--border)] bg-[var(--slate)]'
                      }`}
                      onClick={() => toggleStep(step)}
                    >
                      <span className="font-mono">{done ? '☑' : '☐'}</span>
                      <span>
                        {step}
                        {done && (
                          <span className="ml-2 text-[var(--subtext)]">{checklist.steps[step]}</span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <label className="mt-3 block text-xs font-semibold">
              Notes
              <textarea
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
                rows={2}
                value={checklist.notes}
                onChange={(e) => persist({ ...checklist, notes: e.target.value })}
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                onClick={copyChecklist}
              >
                Copy checklist for {profile.iepSystem}
              </button>
              <Link to="/contacts" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold">
                Parent Contact Log →
              </Link>
              <Link to="/progress" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold">
                Progress data →
              </Link>
            </div>
          </>
        )}
      </section>
    </PageShell>
  )
}
