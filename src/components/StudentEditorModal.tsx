import { useState } from 'react'
import type { Student } from '../lib/students/types'
import {
  STUDENT_STATUS_OPTIONS,
  TILE_COLOR_OPTIONS,
  draftFromStudent,
  emptyStudentDraft,
  studentFromDraft,
  type StudentDraft,
} from '../lib/students/crud'

type Props = {
  mode: 'add' | 'edit'
  initial?: Student
  existing: Student[]
  onSave: (student: Student) => void
  onClose: () => void
}

export function StudentEditorModal({ mode, initial, existing, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<StudentDraft>(() =>
    initial ? draftFromStudent(initial) : emptyStudentDraft(),
  )
  const [error, setError] = useState('')

  function set<K extends keyof StudentDraft>(key: K, value: StudentDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function submit() {
    try {
      const student = studentFromDraft(draft, {
        id: mode === 'edit' ? initial?.id : undefined,
        existing,
        source: mode === 'edit' ? initial?.source || 'manual' : 'manual',
      })
      onSave(student)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save student')
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close student editor"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-label={mode === 'add' ? 'Add student' : 'Edit student'}
        className="relative z-[1101] max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-xl sm:mx-4 sm:rounded-2xl"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-heading text-sm font-bold">
              {mode === 'add' ? 'Add student' : `Edit · ${initial?.name}`}
            </h2>
            <p className="text-[10px] text-[var(--subtext)]">
              Saved in this browser only (FERPA) — not Enrich sync
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-semibold sm:col-span-2">
            Name *
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="First Last"
              autoFocus
            />
          </label>
          <label className="text-xs font-semibold">
            Grade
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.grade}
              onChange={(e) => set('grade', e.target.value)}
              placeholder="3"
            />
          </label>
          <label className="text-xs font-semibold">
            Teacher
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.teacher}
              onChange={(e) => set('teacher', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Case manager
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.caseManager}
              onChange={(e) => set('caseManager', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Services (comma-separated)
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.discipline}
              onChange={(e) => set('discipline', e.target.value)}
              placeholder="SLP, OT"
            />
          </label>
          <label className="text-xs font-semibold">
            Disability / eligibility
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.disability}
              onChange={(e) => set('disability', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Status
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {STUDENT_STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            IEP due
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.iepDue}
              onChange={(e) => set('iepDue', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            504 review due
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.section504Due}
              onChange={(e) => set('section504Due', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Reeval due
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.reevalDue}
              onChange={(e) => set('reevalDue', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Meeting date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.meetingDate}
              onChange={(e) => set('meetingDate', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Home language
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.homeLanguage}
              onChange={(e) => set('homeLanguage', e.target.value)}
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-xs font-semibold">Programs</legend>
            <div className="mt-1 flex flex-wrap gap-3 text-xs">
              {(
                [
                  ['hasIEP', 'IEP'],
                  ['has504', '504'],
                  ['hasMLL', 'MLL'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={draft[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="text-xs font-semibold sm:col-span-2">
            Goals (one per line)
            <textarea
              className="mt-1 min-h-[4.5rem] w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={draft.goalsText}
              onChange={(e) => set('goalsText', e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold">Tile color</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {TILE_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  className={`h-7 w-7 rounded-full border-2 ${
                    draft.color === c ? 'border-[var(--text)]' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                />
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
            onClick={submit}
          >
            {mode === 'add' ? 'Add to caseload' : 'Save changes'}
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
