import { useMemo, useRef, useState } from 'react'
import { useStudents } from '../../lib/students/useStudents'
import { autoBuildSchedule, primaryProviderId, syncSessionsToLiveGroups } from '../../lib/scheduling/autoSchedule'
import { importCaseloadIntoTeam } from '../../lib/scheduling/caseloadBridge'
import {
  downloadSampleSchoolSchedule,
  parseCSV,
  parseMasterScheduleRows,
} from '../../lib/scheduling/csv'
import {
  getSchedMin,
  loadTeamSchedule,
  saveTeamSchedule,
  type TeamScheduleState,
} from '../../lib/scheduling/teamStore'
import { loadSchedule, saveSchedule } from '../../lib/scheduling/store'

type Props = { onFlash: (msg: string) => void }

export function AutoBuildPanel({ onFlash }: Props) {
  const { students: caseload } = useStudents()
  const [state, setState] = useState<TeamScheduleState>(() => loadTeamSchedule())
  const [duration, setDuration] = useState<30 | 60>(state.settings.defaultDuration || 30)
  const [clearExisting, setClearExisting] = useState(true)
  const [syncLive, setSyncLive] = useState(true)
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const [lastResult, setLastResult] = useState<{
    placed: number
    unmet: { name: string; needed: number; got: number }[]
    skippedNoProvider: number
  } | null>(null)
  const [csvPreview, setCsvPreview] = useState<{
    count: number
    errors: string[]
    raw: string
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function persist(next: TeamScheduleState) {
    setState(next)
    saveTeamSchedule(next)
  }

  function importCaseload() {
    const result = importCaseloadIntoTeam(state, caseload)
    persist(result.state)
    onFlash(
      `Caseload synced: +${result.addedStudents} students, ${result.updatedStudents} updated, +${result.addedProviders} providers`,
    )
  }

  function onCsvFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const rows = parseCSV(text)
      const { constraints, errors } = parseMasterScheduleRows(rows)
      if (!constraints.length) {
        setCsvPreview(null)
        onFlash('No valid schedule rows found in CSV')
        return
      }
      setCsvPreview({
        count: constraints.length,
        errors: errors.slice(0, 5),
        raw: text,
      })
      onFlash(`Parsed ${constraints.length} protected times (confirm to apply)`)
    }
    reader.readAsText(file)
  }

  function applyCsv() {
    if (!csvPreview) return
    const rows = parseCSV(csvPreview.raw)
    const { constraints } = parseMasterScheduleRows(rows)
    persist({
      ...state,
      masterConstraints: [...state.masterConstraints, ...constraints],
    })
    setCsvPreview(null)
    onFlash(`Added ${constraints.length} school schedule constraints`)
  }

  function replaceCsv() {
    if (!csvPreview) return
    const rows = parseCSV(csvPreview.raw)
    const { constraints } = parseMasterScheduleRows(rows)
    persist({ ...state, masterConstraints: constraints })
    setCsvPreview(null)
    onFlash(`Replaced constraints with ${constraints.length} from school schedule`)
  }

  function runBuild() {
    const result = autoBuildSchedule(state, {
      clearExisting,
      duration,
      providerId: providerFilter,
    })
    persist(result.state)
    setLastResult({
      placed: result.placed,
      unmet: result.unmet.map((u) => ({ name: u.name, needed: u.needed, got: u.got })),
      skippedNoProvider: result.skippedNoProvider,
    })

    if (syncLive) {
      const pid =
        providerFilter !== 'all' ? providerFilter : primaryProviderId(result.state)
      if (pid) {
        const live = syncSessionsToLiveGroups(result.state, loadSchedule(), pid)
        saveSchedule(live)
        onFlash(`Built ${result.placed} sessions + synced Live Groups`)
      } else {
        onFlash(`Built ${result.placed} sessions (no provider to sync Live Groups)`)
      }
    } else {
      onFlash(`Built ${result.placed} sessions — open Week Grid to review`)
    }
  }

  const coverage = useMemo(() => {
    return state.students
      .filter((s) => (providerFilter === 'all' ? true : s.providerId === providerFilter))
      .map((s) => {
        const got = getSchedMin(state, s.id)
        return {
          id: s.id,
          name: s.name,
          need: s.requiredMinutes,
          got,
          pct: s.requiredMinutes > 0 ? Math.min(got / s.requiredMinutes, 1) : 0,
        }
      })
      .sort((a, b) => a.pct - b.pct)
  }, [state, providerFilter])

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section
        className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
        style={{ borderTop: '4px solid var(--accent)' }}
      >
        <h2 className="font-heading text-sm font-bold">Auto-Build your week</h2>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          Upload the school master schedule (lunch / specials / protected times), sync your PRISM
          caseload, then let PRISM place sessions around those constraints using Parameters
          (day window + default duration).
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-[var(--text)]">
          <li>Import caseload (creates providers from case managers)</li>
          <li>Upload school schedule CSV → protected times</li>
          <li>Tune minutes on Week Grid sidebar if needed, then Build</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
          1 · Caseload
        </h3>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          {caseload.length} students on your PRISM caseload · {state.students.length} on Team
          roster · {state.providers.length} providers
        </p>
        <button
          type="button"
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
          onClick={importCaseload}
        >
          Import / refresh caseload into scheduler
        </button>
        <p className="mt-2 text-[10px] text-[var(--subtext)]">
          Default minutes: Speech 60/wk (2×30), Resource 120/wk, OT/PT/Counseling 30/wk — edit in
          Week Grid after import.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
          2 · School schedule CSV
        </h3>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          Format: <code className="text-[10px]">Day, StartTime, EndTime, Type, Label</code> — Day
          can be Monday…Friday or All. Times like 10:00 or 10:00 AM.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-dashed border-[var(--accent)] bg-sky-50 px-4 py-3 text-xs font-semibold text-[var(--accent)]"
            onClick={() => fileRef.current?.click()}
          >
            Upload school schedule CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onCsvFile(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            onClick={downloadSampleSchoolSchedule}
          >
            Download sample CSV
          </button>
          <span className="self-center text-[10px] text-[var(--subtext)]">
            {state.masterConstraints.length} constraints currently loaded
          </span>
        </div>
        {csvPreview && (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--slate)] p-3">
            <p className="text-xs font-semibold">
              Ready: {csvPreview.count} protected time rows
            </p>
            {csvPreview.errors.length > 0 && (
              <ul className="mt-1 text-[10px] text-amber-800">
                {csvPreview.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
                onClick={applyCsv}
              >
                Add to existing
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                onClick={replaceCsv}
              >
                Replace all constraints
              </button>
              <button
                type="button"
                className="text-xs text-[var(--subtext)]"
                onClick={() => setCsvPreview(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
          3 · Build options
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-[10px] font-bold">
            Provider
            <select
              className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">All providers</option>
              {state.providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-[10px] font-bold">Session length</legend>
            <div className="mt-1 flex gap-3">
              {([30, 60] as const).map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="radio"
                    checked={duration === d}
                    onChange={() => setDuration(d)}
                  />
                  {d} min
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={clearExisting}
            onChange={(e) => setClearExisting(e.target.checked)}
          />
          Clear existing Team sessions before building
        </label>
        <label className="mt-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={syncLive} onChange={(e) => setSyncLive(e.target.checked)} />
          Also fill <strong>Live Groups</strong> for primary / selected provider
        </label>
        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700"
          onClick={runBuild}
          disabled={state.students.length === 0}
        >
          Build my schedule
        </button>
      </section>

      {lastResult && (
        <section className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <h3 className="text-sm font-bold text-teal-900">
            Placed {lastResult.placed} sessions
          </h3>
          {lastResult.skippedNoProvider > 0 && (
            <p className="mt-1 text-xs text-amber-800">
              {lastResult.skippedNoProvider} student(s) skipped — no provider assigned. Import
              caseload or assign in Week Grid.
            </p>
          )}
          {lastResult.unmet.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-teal-900">
                Couldn&apos;t fully meet minutes ({lastResult.unmet.length}):
              </p>
              <ul className="mt-1 max-h-32 overflow-y-auto text-[10px] text-teal-950">
                {lastResult.unmet.map((u) => (
                  <li key={u.name}>
                    {u.name}: {u.got}/{u.needed} min
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[10px] text-teal-800">
                Tip: widen day window in Parameters, free up specials, or add pull-time windows on
                providers.
              </p>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
          Current coverage
        </h3>
        {coverage.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--subtext)]">Import caseload to see coverage.</p>
        ) : (
          <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
            {coverage.map((c) => (
              <li key={c.id} className="text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{c.name}</span>
                  <span>
                    {c.got}/{c.need}m
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${c.pct * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
