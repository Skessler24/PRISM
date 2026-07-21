import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import {
  formatContactForCopy,
  loadParentContacts,
  saveParentContacts,
  type ContactMethod,
  type ParentContact,
} from '../../lib/parent-contacts/store'

const METHODS: ContactMethod[] = ['phone', 'email', 'in-person', 'message', 'other']

export function ParentContactsPage() {
  const { students } = useStudents()
  const [contacts, setContacts] = useState<ParentContact[]>(() => loadParentContacts())
  const [filterStudent, setFilterStudent] = useState('')
  const [toast, setToast] = useState('')

  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState<ContactMethod>('phone')
  const [contactName, setContactName] = useState('')
  const [notes, setNotes] = useState('')
  const [followUpNeeded, setFollowUpNeeded] = useState(false)

  const visible = useMemo(() => {
    const list = filterStudent ? contacts.filter((c) => c.studentId === filterStudent) : contacts
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [contacts, filterStudent])

  const followUps = contacts.filter((c) => c.followUpNeeded)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function save() {
    if (!studentId) {
      flash('Select a student')
      return
    }
    const row: ParentContact = {
      id: `pc-${Date.now()}`,
      studentId,
      date,
      method,
      contactName,
      notes,
      followUpNeeded,
      createdAt: new Date().toISOString(),
    }
    const next = [row, ...contacts]
    setContacts(next)
    saveParentContacts(next)
    flash('Contact saved locally')
    setNotes('')
    setFollowUpNeeded(false)
  }

  function toggleFollowUp(id: string) {
    const next = contacts.map((c) =>
      c.id === id ? { ...c, followUpNeeded: !c.followUpNeeded } : c,
    )
    setContacts(next)
    saveParentContacts(next)
  }

  function remove(id: string) {
    const next = contacts.filter((c) => c.id !== id)
    setContacts(next)
    saveParentContacts(next)
  }

  return (
    <PageShell
      title="📞 Parent Contact Log"
      description="Log family contacts for your caseload. Data stays in your browser and fills the Caseload Binder PDF — enter official documentation in your system of record as required."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      {followUps.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
          <strong>{followUps.length} follow-up{followUps.length === 1 ? '' : 's'} flagged</strong>
          {' · '}
          <Link to="/binder" className="font-semibold text-[var(--accent)]">
            Include in Caseload Binder →
          </Link>
        </div>
      )}

      <section className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">New contact</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Student
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
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
          <label className="text-xs font-semibold">
            Date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Method
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={method}
              onChange={(e) => setMethod(e.target.value as ContactMethod)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Who you spoke with
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Parent / guardian name"
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Notes
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={followUpNeeded}
              onChange={(e) => setFollowUpNeeded(e.target.checked)}
            />
            Follow-up needed
          </label>
        </div>
        <button
          type="button"
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
          onClick={save}
        >
          Save contact
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-heading text-sm font-bold">Log ({visible.length})</h2>
          <label className="text-xs font-semibold">
            Filter
            <select
              className="ml-2 rounded-lg border border-[var(--border)] px-2 py-1"
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
            >
              <option value="">All students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul className="mt-3 space-y-2">
          {!visible.length && (
            <li className="text-xs text-[var(--subtext)]">No contacts yet — log your first family call above.</li>
          )}
          {visible.map((c) => {
            const s = students.find((x) => x.id === c.studentId)
            return (
              <li
                key={c.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--slate)] px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <strong>
                      {s?.name} · {c.date} · {c.method}
                    </strong>
                    {c.followUpNeeded && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        Follow-up
                      </span>
                    )}
                    <p className="text-[var(--subtext)]">{c.contactName || '—'}</p>
                    <p className="mt-1">{c.notes || '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded border border-[var(--border)] px-2 py-1 font-semibold"
                      onClick={() =>
                        void navigator.clipboard.writeText(
                          formatContactForCopy(c, s?.name || c.studentId),
                        )
                      }
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      className="rounded border border-[var(--border)] px-2 py-1 font-semibold"
                      onClick={() => toggleFollowUp(c.id)}
                    >
                      {c.followUpNeeded ? 'Clear follow-up' : 'Flag follow-up'}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-200 px-2 py-1 font-semibold text-red-700"
                      onClick={() => remove(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </PageShell>
  )
}
