import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { readSuiteMode } from '../../lib/templates/catalog'

const TRAINING = [
  {
    title: 'Enrich IEP System Basics',
    desc: 'Navigate, enter data, Convert → Validate → Finalize. PRISM drafts; Enrich remains SoR in Companion mode.',
  },
  {
    title: 'FBA/BIP Process',
    desc: 'Operational definition, ABC data, function hypothesis, then BIP. Open React FBA/BIP Engine for guided drafts.',
  },
  {
    title: 'MTSS/RTI Referral Steps',
    desc: 'Intervention fidelity, dual DAT referral when required, consent clock starts on signed consent.',
  },
  {
    title: 'IEP Goal Writing',
    desc: 'SMART goals with measurable criteria — Generation Studio can draft; human review required.',
  },
  {
    title: 'Meeting & NOM Procedures',
    desc: 'Use district profile NOM lead time (not a hardcoded 10). Dashboard meeting timer for local notes.',
  },
  {
    title: 'Transfer & MDR',
    desc: 'Eval Tracker Transfer Wizard + Manifestation Determination within district school-day window.',
  },
]

const COMMUNITY = [
  { name: 'Colorado CDE — Exceptional Student Services', url: 'https://www.cde.state.co.us/' },
  { name: 'IDEA Parent Rights overview', url: 'https://sites.ed.gov/idea/' },
  { name: 'Understood.org — IEP & 504 guides', url: 'https://www.understood.org/' },
]

export function ResourcesPage() {
  const { profile } = useDistrictProfile()
  const mode = readSuiteMode()
  const [open, setOpen] = useState<string | null>(TRAINING[0].title)
  const r = profile.rules

  return (
    <PageShell
      title="📚 Resource Hub"
      description="Training library, district rule cheat sheet, Companion vs Standalone SoR reference, and community links."
    >
      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">{profile.name} rule cheat sheet</h2>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          Pulled from district profile JSON — not hardcoded UI constants.
        </p>
        <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <li>
            <strong>NOM lead time:</strong> {r.nomLeadTimeDays} calendar days
          </li>
          <li>
            <strong>Eval window:</strong> {r.evaluationWindowDays} days ({r.evaluationWindowAppliesTo})
          </li>
          <li>
            <strong>RTI gate:</strong> {r.rtiMinimumCycles} × {r.rtiCycleLengthWeeks} weeks
          </li>
          <li>
            <strong>Service log:</strong> within {r.serviceLogHours} hours
          </li>
          <li>
            <strong>MDR:</strong> {r.manifestationDeterminationSchoolDays} school days
          </li>
          <li>
            <strong>Transfer finalize:</strong> {r.transferCompleteDays} days
          </li>
          <li className="sm:col-span-2">
            <strong>Finalize sequence:</strong> {r.enrichFinalizeSequence.join(' → ')}
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link to="/district" className="font-semibold text-[var(--accent)]">
            Open District Profile →
          </Link>
          <Link to="/evaluations" className="font-semibold text-[var(--accent)]">
            Eval Validation →
          </Link>
          <Link to="/fba" className="font-semibold text-[var(--accent)]">
            FBA/BIP →
          </Link>
        </div>
      </section>

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">PRISM vs official IEP system</h2>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          Active mode (from deploy Admin settings if set): <strong>{mode}</strong> · Profile SoR:{' '}
          <strong>{profile.iepSystem}</strong>
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
                <th className="p-2">Task</th>
                <th className="p-2">Companion</th>
                <th className="p-2">Standalone</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Draft present levels / goals', 'PRISM → copy', 'PRISM can own'],
                ['Finalize IEP / 504', profile.iepSystem, 'PRISM (when enabled)'],
                ['Reminders / checklists', 'PRISM', 'PRISM'],
                ['Classroom materials', 'PRISM (local)', 'PRISM (local)'],
                ['Live Enrich sync', 'Never', 'Never'],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-2 font-semibold">{row[0]}</td>
                  <td className="p-2">{row[1]}</td>
                  <td className="p-2">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Training library</h2>
        <div className="mt-3 space-y-2">
          {TRAINING.map((t) => (
            <button
              key={t.title}
              type="button"
              className="block w-full rounded-xl border border-[var(--border)] px-3 py-3 text-left"
              onClick={() => setOpen(open === t.title ? null : t.title)}
            >
              <p className="text-sm font-semibold">{t.title}</p>
              {open === t.title && <p className="mt-1 text-xs text-[var(--subtext)]">{t.desc}</p>}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Community resources</h2>
        <ul className="mt-3 space-y-2 text-xs">
          {COMMUNITY.map((c) => (
            <li key={c.url}>
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--accent)] underline"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
