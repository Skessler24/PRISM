import { useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { readSuiteMode } from '../../lib/templates/catalog'

const TRAINING = [
  {
    title: 'Enrich IEP System Basics',
    desc: 'Navigate, enter data, Convert → Validate → Finalize',
  },
  {
    title: 'FBA/BIP Process',
    desc: 'Operational definition, ABC data, function, BIP sections',
  },
  {
    title: 'MTSS/RTI Referral Steps',
    desc: 'Intervention fidelity, dual referral, consent clock',
  },
  {
    title: 'IEP Goal Writing',
    desc: 'SMART goals with measurable criteria',
  },
  {
    title: 'Meeting & NOM Procedures',
    desc: '10-day NOM lead time and attendance documentation',
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

  return (
    <PageShell
      title="📚 Resource Hub"
      description="Training library, Companion vs Standalone SoR reference, and community links — district-agnostic framing with CCSD as Pilot #1."
    >
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
                className="font-semibold text-[var(--accent)] underline"
                href={c.url}
                target="_blank"
                rel="noreferrer"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] text-[var(--subtext)]">
          Sources tracked on this profile: {profile.sources.slice(0, 3).join(' · ')}
          {profile.sources.length > 3 ? '…' : ''}
        </p>
      </section>
    </PageShell>
  )
}
