import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { FEATURE_LABELS, type FeatureName } from '../../lib/district-profiles/types'
import type { TimelineEventType } from '../../lib/district-profiles/loadProfile'
import { FieldTip } from '../../lib/help-assist/FieldTip'

const EVENT_OPTIONS: TimelineEventType[] = [
  'Consent Received',
  'Referral',
  'NOM Needed',
  'Annual Review Due',
  'Reevaluation Due',
  'Transfer Notified',
]

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const toneClass: Record<string, string> = {
  info: 'border-l-blue-500 bg-sky',
  warn: 'border-l-amber-500 bg-sun',
  danger: 'border-l-red-500 bg-coral',
  ok: 'border-l-green-500 bg-mint',
}

export function DistrictProfilePage() {
  const {
    profile,
    isFeatureEnabled,
    toggleFeature,
    calculateTimeline,
    availableProfiles,
    profileId,
  } = useDistrictProfile()

  const [event, setEvent] = useState<TimelineEventType>('Consent Received')
  const [trigger, setTrigger] = useState(() => new Date().toISOString().slice(0, 10))

  const lines = useMemo(() => {
    const d = new Date(`${trigger}T12:00:00`)
    if (Number.isNaN(d.getTime())) return []
    return calculateTimeline(event, d)
  }, [calculateTimeline, event, trigger])

  const featureNames = Object.keys(profile.features) as FeatureName[]

  return (
    <PageShell
      title="🏛️ District Profile"
      description={`${profile.name} (${profile.state}) · IEP system: ${profile.iepSystem}. Rules are data-driven from Enrich + DAT — not hardcoded. Profile #2 can plug in later.`}
    >
      <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 text-xs text-[var(--subtext)]">
        Active profile: <strong className="text-[var(--text)]">{profile.name}</strong> · id{' '}
        <code>{profileId}</code>
        {availableProfiles.length < 2 && (
          <span className="ml-2 italic">
            {/* TODO(Profile #2): add another district JSON + picker UI */}
            (Profile #2 interface ready — add another file under district-profiles/)
          </span>
        )}
        <p className="mt-1">
          PRISM never syncs live to Enrich (HIPAA). This profile powers reminders, checklists,
          timeline math, and Help Assist.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Timeline rules</h2>
          <ul className="mt-3 space-y-2 text-xs text-[var(--text)]">
            <li>
              NOM lead time: <strong>{profile.rules.nomLeadTimeDays} calendar days</strong>
            </li>
            <li>
              Evaluation window:{' '}
              <strong>{profile.rules.evaluationWindowDays} days</strong> (
              {profile.rules.evaluationWindowAppliesTo.replaceAll('_', ' ')})
            </li>
            <li>
              RTI: {profile.rules.rtiMinimumCycles} cycles × {profile.rules.rtiCycleLengthWeeks}{' '}
              weeks
            </li>
            <li>Parent referral notify: {profile.rules.parentReferralNotificationDays} days</li>
            <li>
              Manifestation determination: {profile.rules.manifestationDeterminationSchoolDays}{' '}
              school days
            </li>
            <li>
              Transfer complete: {profile.rules.transferCompleteDays} days · non-adopt annual:{' '}
              {profile.rules.transferAdoptAnnualDays} · reeval window:{' '}
              {profile.rules.transferReevalDays}
            </li>
            <li>Team lead must be: {profile.rules.teamLeadMustBe.join(' or ')}</li>
          </ul>

          <h3 className="mt-4 font-heading text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
            Enrich finalize sequence
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
            {profile.rules.enrichFinalizeSequence.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Timeline calculator</h2>
          <FieldTip tipId="timeline-calculator" className="mb-2 mt-2" />
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Uses this district&apos;s rule values — not hardcoded CCSD numbers in the UI.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Event
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-2"
                value={event}
                onChange={(e) => setEvent(e.target.value as TimelineEventType)}
              >
                {EVENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              Trigger date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-2"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 space-y-2">
            {lines.map((line) => (
              <div
                key={line.label}
                className={`rounded-lg border-l-4 p-2 text-xs ${toneClass[line.tone]}`}
              >
                <p className="font-semibold">{line.label}</p>
                <p className="text-[var(--subtext)]">{formatDate(line.date)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Feature toggles</h2>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          Flip features for this district. Overrides persist in localStorage. Components should call{' '}
          <code>isFeatureEnabled(...)</code>.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {featureNames.map((name) => {
            const on = isFeatureEnabled(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleFeature(name)}
                className="flex items-center justify-between rounded-xl bg-[var(--slate)] px-3 py-3 text-left text-xs font-semibold"
              >
                <span>{FEATURE_LABELS[name] || name}</span>
                <span
                  className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-green-500' : 'bg-slate-300'}`}
                  aria-hidden
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      on ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">DAT procedures (CCSD)</h2>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          Dual referral required: <strong>{String(profile.dat.dualReferralRequired)}</strong> ·
          Intervention if missing: {profile.dat.interventionWeeksIfMissing} weeks
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
          {profile.dat.paths.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1 text-xs text-[var(--subtext)]">
          {profile.dat.notes.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      </section>

      <section className="mt-3 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Compliance rule table</h2>
        <table className="mt-3 w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
              <th className="p-2">Rule</th>
              <th className="p-2">Requirement</th>
              <th className="p-2">Source</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {profile.ruleTable.map((r) => (
              <tr key={r.id} className="border-b border-[var(--border)] align-top">
                <td className="p-2 font-semibold">{r.rule}</td>
                <td className="p-2">{r.requirement}</td>
                <td className="p-2">
                  <span className="rounded-full bg-sky px-2 py-0.5 text-[10px] font-semibold text-navy">
                    {r.source}
                  </span>
                </td>
                <td className="p-2">{r.active ? '✅ Active' : 'Off'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageShell>
  )
}
