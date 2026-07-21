import { PageShell } from '../../components/PageShell'

export function DistrictProfilePage() {
  return (
    <PageShell
      title="🏛️ District Profile"
      description="Cherry Creek is Profile #1. Feature toggles, timeline rules, and Enrich crosswalk data land in Prompt 2 — nothing hardcoded to assume CCSD forever."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Active profile (placeholder)</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Cherry Creek School District · Colorado · Enrich IEP system
          </p>
          <ul className="mt-3 space-y-1 text-xs text-[var(--text)]">
            <li>• NOM lead time: 10 days</li>
            <li>• Evaluation window: 60 days</li>
            <li>• Manifestation determination: 10 school days</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Coming in Prompt 2</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Typed `DistrictProfile`, `cherry-creek.json` from Enrich guide rules, feature toggles that
            actually flip `isFeatureEnabled`, and a clean interface for Profile #2.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
