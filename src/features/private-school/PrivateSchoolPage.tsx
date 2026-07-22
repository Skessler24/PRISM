import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { daysUntil, statusBadgeClass } from '../../lib/students/normalizeStudent'
import { readSuiteMode, suiteModeNote } from '../../lib/templates/catalog'
import {
  buildIspDraft,
  loadPrivateSchoolPlans,
  upsertPrivateSchoolPlan,
  type PrivateSchoolPlan,
} from '../../lib/private-school/store'

export function PrivateSchoolPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const mode = readSuiteMode()
  const list = useMemo(() => students.filter((s) => s.hasPrivateSchool), [students])
  const [plans, setPlans] = useState(() => loadPrivateSchoolPlans())
  const [studentId, setStudentId] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [servicesSummary, setServicesSummary] = useState('Speech-language therapy (equitable services)')
  const [directMinutes, setDirectMinutes] = useState(30)
  const [consultationMinutes, setConsultationMinutes] = useState(15)
  const [planDue, setPlanDue] = useState('')
  const [parentConsultDate, setParentConsultDate] = useState('')
  const [notes, setNotes] = useState('')
  const [draft, setDraft] = useState('')
  const [toast, setToast] = useState('')

  const student = list.find((s) => s.id === studentId) || students.find((s) => s.id === studentId)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function savePlan() {
    if (!studentId) {
      flash('Select a student')
      return
    }
    const s = students.find((x) => x.id === studentId)
    const plan: PrivateSchoolPlan = {
      id: `isp-${studentId}`,
      studentId,
      studentName: s?.name || studentId,
      schoolName: schoolName || s?.privateSchoolName || '',
      servicesSummary,
      consultationMinutes,
      directMinutes,
      planDue: planDue || s?.privateSchoolPlanDue || '',
      parentConsultDate,
      notes,
      draftText: draft,
      updatedAt: new Date().toISOString(),
    }
    const text = buildIspDraft(plan, profile.name, profile.iepSystem)
    const withDraft = {
      ...plan,
      draftText: `${text}\n\n${suiteModeNote(mode, profile.iepSystem)}`,
    }
    upsertPrivateSchoolPlan(withDraft)
    setPlans(loadPrivateSchoolPlans())
    setDraft(withDraft.draftText)
    flash('ISP draft saved locally')
  }

  function loadExisting(id: string) {
    setStudentId(id)
    const s = students.find((x) => x.id === id)
    const p = plans.find((x) => x.studentId === id)
    setSchoolName(p?.schoolName || s?.privateSchoolName || '')
    setPlanDue(p?.planDue || s?.privateSchoolPlanDue || '')
    setServicesSummary(p?.servicesSummary || 'Speech-language therapy (equitable services)')
    setDirectMinutes(p?.directMinutes ?? 30)
    setConsultationMinutes(p?.consultationMinutes ?? 15)
    setParentConsultDate(p?.parentConsultDate || '')
    setNotes(p?.notes || '')
    setDraft(p?.draftText || '')
  }

  return (
    <PageShell
      title="🏫 Private School Service Plans"
      description={`Equitable services / ISP drafts for parentally placed private school students. Module toggle: District Admin → privateSchool (off for ${profile.name} Companion by default).`}
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Private school flags', value: list.length },
          { label: 'ISP drafts saved', value: plans.length },
          {
            label: 'Plan due ≤45d',
            value: list.filter((s) => {
              const d = daysUntil(s.privateSchoolPlanDue)
              return d != null && d >= 0 && d <= 45
            }).length,
          },
          { label: 'Also IEP', value: list.filter((s) => s.hasIEP).length },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3 text-center shadow-card"
          >
            <p className="font-mono text-2xl font-bold text-[var(--accent)]">{c.value}</p>
            <p className="text-xs text-[var(--subtext)]">{c.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Caseload (hasPrivateSchool)</h2>
        {!list.length && (
          <p className="mt-2 text-xs text-[var(--subtext)]">
            No students flagged yet. Demo includes Nora L. when Private School module is on — or set{' '}
            <code>hasPrivateSchool</code> on a student in local data.
          </p>
        )}
        <table className="mt-3 w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
              <th className="p-2">Student</th>
              <th className="p-2">School</th>
              <th className="p-2">Plan due</th>
              <th className="p-2">Status</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const d = daysUntil(s.privateSchoolPlanDue)
              return (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-2 font-semibold">{s.name}</td>
                  <td className="p-2">{s.privateSchoolName || '—'}</td>
                  <td className="p-2 font-mono">
                    {s.privateSchoolPlanDue || '—'}
                    {d != null ? ` (${d}d)` : ''}
                  </td>
                  <td className="p-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="font-semibold text-[var(--accent)]"
                      onClick={() => loadExisting(s.id)}
                    >
                      Open ISP →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">ISP draft builder</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Student
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={studentId}
              onChange={(e) => loadExisting(e.target.value)}
            >
              <option value="">Select…</option>
              {(list.length ? list : students).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.hasPrivateSchool ? '' : ' (flag off)'}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Private school name
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Plan due
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={planDue}
              onChange={(e) => setPlanDue(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Parent consultation date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={parentConsultDate}
              onChange={(e) => setParentConsultDate(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Direct minutes / week
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={directMinutes}
              onChange={(e) => setDirectMinutes(Number(e.target.value) || 0)}
            />
          </label>
          <label className="text-xs font-semibold">
            Consultation minutes / week
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={consultationMinutes}
              onChange={(e) => setConsultationMinutes(Number(e.target.value) || 0)}
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Services summary
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={2}
              value={servicesSummary}
              onChange={(e) => setServicesSummary(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Notes
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
        {student && (
          <p className="mt-2 text-[10px] text-[var(--subtext)]">
            Goals on file: {student.goals.join(' · ') || '—'}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
            onClick={savePlan}
          >
            Save / generate ISP draft
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            disabled={!draft}
            onClick={() => void navigator.clipboard.writeText(draft).then(() => flash('Copied'))}
          >
            Copy for {profile.iepSystem}
          </button>
        </div>
        {draft && (
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-[10px]">
            {draft}
          </pre>
        )}
      </section>
    </PageShell>
  )
}
