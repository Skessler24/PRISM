import { useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import { chat } from '../../lib/ai/client'

const CLD_STEPS = [
  'Home language survey / family interview completed',
  'Interpreter arranged for meetings (if needed)',
  'Prior schooling & language history documented',
  'Rule out language difference vs. disability before SPED referral',
  'Use non-discriminatory / CLD-appropriate assessments',
  'Include ELD teacher on IEP/504 team when relevant',
  'Provide notices in preferred language when available',
  'Document Acculturation / CLD considerations in present levels',
]

const LANGS = ['Spanish', 'Arabic', 'Vietnamese', 'Mandarin', 'Amharic', 'Russian'] as const

export function AccessibilityPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [tab, setTab] = useState<'cld' | 'multi' | 'contrast'>('cld')
  const [highContrast, setHighContrast] = useState(false)
  const [lang, setLang] = useState<(typeof LANGS)[number]>('Spanish')
  const [mllId, setMllId] = useState('')
  const [nomOut, setNomOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const mllStudents = students.filter((s) => s.hasMLL)
  const selected = students.find((x) => x.id === mllId)
  const preferredLang = selected?.homeLanguage || lang

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  async function generateTranslatedNomHelper() {
    setBusy(true)
    const res = await chat([
      {
        role: 'system',
        content: `You help ${profile.name} teams prepare multilingual NOM / meeting language supports. Output English scaffolding plus a short ${preferredLang} family-facing reminder when possible. No live Enrich sync.`,
      },
      {
        role: 'user',
        content: `Create a translated NOM / interpreter support helper for ${selected?.name || 'the family'}.
Preferred language: ${preferredLang}
Interpreter needed: ${selected?.interpreterNeeded ? 'YES' : 'unknown / arrange if needed'}
ELD level: ${selected?.eldLevel || 'n/a'}
NOM lead time: ${profile.rules.nomLeadTimeDays} calendar days

Include: interpreter request email, family rights reminder, and a short bilingual meeting notice outline.`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      flash(res.error)
      return
    }
    setNomOut(res.content)
    flash('Translated NOM helper ready')
  }

  return (
    <PageShell
      title="♿ Accessibility Studio"
      description="CLD safeguards, multilingual NOM helpers, and high-contrast reading mode. CCSD Companion keeps MLL tab optional — CLD lives here."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['cld', 'CLD Guidance'],
            ['multi', 'Multilingual'],
            ['contrast', 'High Contrast'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              tab === id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--subtext)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'cld' && (
        <section
          className={`rounded-2xl border border-[var(--border)] p-4 shadow-card ${
            highContrast ? 'bg-black text-white' : 'bg-[var(--card-bg)]'
          }`}
        >
          <h2 className="font-heading text-sm font-bold">CLD-safe evaluation checklist</h2>
          <FieldTip tipId="cld-guidance" className="mb-2 mt-2" />
          <select
            className="mt-2 w-full max-w-xs rounded-lg border border-[var(--border)] px-2 py-2 text-xs text-[var(--text)]"
            value={mllId}
            onChange={(e) => setMllId(e.target.value)}
          >
            <option value="">Select MLL student (optional)…</option>
            {mllStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.homeLanguage || 'language TBD'}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-2 text-xs opacity-80">
              {selected.name}: {selected.homeLanguage || '—'} · ELD {selected.eldLevel || '—'} ·
              Interpreter {selected.interpreterNeeded ? 'YES' : 'No'}
            </p>
          )}
          <div className="mt-3 space-y-2">
            {CLD_STEPS.map((step, i) => (
              <label key={step} className="flex items-start gap-2 text-xs">
                <input type="checkbox" className="mt-0.5" />
                <span className="font-semibold">
                  {i + 1}. {step}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      {tab === 'multi' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Multilingual meeting helper</h2>
          <FieldTip tipId="cld-guidance" className="mb-2 mt-2" />
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Draft interpreter requests and translated NOM scaffolds. Audio TTS remains stubbed until a
            speak vendor is wired.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Preferred language
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={lang}
                onChange={(e) => setLang(e.target.value as (typeof LANGS)[number])}
              >
                {LANGS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              Student (optional)
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={mllId}
                onChange={(e) => setMllId(e.target.value)}
              >
                <option value="">None</option>
                {mllStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
            {`MEETING LANGUAGE SUPPORT REQUEST

Please arrange an interpreter for ${preferredLang}.
Provide NOM / parent rights in ${preferredLang} when a translation is available.
Confirm family preferred contact language before the meeting.
NOM lead time for ${profile.name}: ${profile.rules.nomLeadTimeDays} calendar days.

Generated by PRISM Accessibility Studio`}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              onClick={() =>
                void navigator.clipboard.writeText(
                  `Please arrange an interpreter for ${preferredLang}. Provide NOM / parent rights in ${preferredLang} when available.`,
                )
              }
            >
              Copy request
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => void generateTranslatedNomHelper()}
            >
              {busy ? 'Generating…' : 'AI translated NOM helper'}
            </button>
          </div>
          {nomOut && (
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
              {nomOut}
            </pre>
          )}
        </section>
      )}

      {tab === 'contrast' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">High contrast mode</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Session toggle for this page&apos;s CLD panel. Theme Studio still owns full-app palettes.
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
            onClick={() => setHighContrast((v) => !v)}
          >
            {highContrast ? 'Turn off high contrast preview' : 'Preview high contrast on CLD panel'}
          </button>
        </section>
      )}
    </PageShell>
  )
}
