import { useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import { chat, speak } from '../../lib/ai/client'

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

const ACC_TABS = [
  ['audio', 'Audio Forms'],
  ['multi', 'Multilingual'],
  ['contrast', 'High Contrast'],
  ['braille', 'Braille Ready'],
  ['visual', 'Visual Retooling'],
  ['cld', 'CLD Guidance'],
] as const

type AccTab = (typeof ACC_TABS)[number][0]

type Props = { embedded?: boolean }

export function AccessibilityPage({ embedded }: Props = {}) {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [tab, setTab] = useState<AccTab>('audio')
  const [highContrast, setHighContrast] = useState(false)
  const [dyslexiaFont, setDyslexiaFont] = useState(false)
  const [largePrint, setLargePrint] = useState(false)
  const [lang, setLang] = useState<(typeof LANGS)[number]>('Spanish')
  const [mllId, setMllId] = useState('')
  const [nomOut, setNomOut] = useState('')
  const [audioText, setAudioText] = useState('')
  const [brailleText, setBrailleText] = useState('')
  const [visualText, setVisualText] = useState('')
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

  async function playAudio() {
    if (!audioText.trim()) {
      flash('Paste text to read aloud')
      return
    }
    setBusy(true)
    const res = await speak(audioText)
    setBusy(false)
    if (!res.audioBase64) {
      flash(res.note || 'TTS not configured yet — copy text for another reader')
      return
    }
    flash('Audio ready')
  }

  function downloadBrf() {
    const body = brailleText.trim() || 'Paste content first.'
    const brf = `BRF-READY (ASCII staging for embosser)\n\n${body.toUpperCase().replace(/[^\x20-\x7E\n]/g, '')}\n`
    const blob = new Blob([brf], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'prism-braille-ready.brf.txt'
    a.click()
    flash('Braille-ready file downloaded')
  }

  const previewClass = [
    highContrast ? 'bg-black text-yellow-300' : 'bg-[var(--card-bg)] text-[var(--text)]',
    dyslexiaFont ? 'font-mono tracking-wide' : '',
    largePrint ? 'text-base leading-relaxed' : 'text-xs',
  ].join(' ')

  return (
    <PageShell
      embedded={embedded}
      title="♿ Accessibility Studio"
      description="Audio forms, multilingual helpers, high contrast, Braille-ready export, visual retooling, and CLD guidance — restored from your Copilot Accessibility tab."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {ACC_TABS.map(([id, label]) => (
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

      {tab === 'audio' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Audio Forms</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Paste NOM, rights, or classroom text to prepare audio. Uses <code>/api/ai-speak</code> when a
            TTS vendor is configured; otherwise Copy for your device reader.
          </p>
          <textarea
            className="mt-3 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            rows={6}
            placeholder="Paste form or notice text…"
            value={audioText}
            onChange={(e) => setAudioText(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => void playAudio()}
            >
              {busy ? 'Working…' : 'Generate audio'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              onClick={() => void navigator.clipboard.writeText(audioText)}
            >
              Copy text
            </button>
          </div>
        </section>
      )}

      {tab === 'multi' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Multilingual meeting helper</h2>
          <FieldTip tipId="cld-guidance" className="mb-2 mt-2" />
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
              Copy interpreter request
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
          <h2 className="font-heading text-sm font-bold">High contrast generator</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Preview reading modes for handouts (dyslexia-friendly spacing, high contrast). Full-app
            themes stay in Theme Studio.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
              onClick={() => setHighContrast((v) => !v)}
            >
              {highContrast ? 'Contrast on' : 'High contrast'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              onClick={() => setDyslexiaFont((v) => !v)}
            >
              {dyslexiaFont ? 'Dyslexia spacing on' : 'Dyslexia-friendly spacing'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              onClick={() => setLargePrint((v) => !v)}
            >
              {largePrint ? 'Large print on' : 'Large print'}
            </button>
          </div>
          <div className={`mt-3 rounded-xl border border-[var(--border)] p-3 ${previewClass}`}>
            Preview: Students benefit when text contrast, letter spacing, and size reduce visual
            stress. Use Theme Studio for whole-app palettes; use this panel for document handouts.
          </div>
        </section>
      )}

      {tab === 'braille' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Braille-ready formatting</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Stage ASCII text for embosser / BRF workflows. Not a certified Braille translator — review
            with your TVI.
          </p>
          <textarea
            className="mt-3 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            rows={5}
            placeholder="Paste text to convert to Braille-ready format…"
            value={brailleText}
            onChange={(e) => setBrailleText(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
            onClick={downloadBrf}
          >
            Download BRF-ready file
          </button>
        </section>
      )}

      {tab === 'visual' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Visual retooling</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Simplify layout for large print, Irlen-friendly pastel backgrounds, or para “how to use”
            notes.
          </p>
          <textarea
            className="mt-3 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            rows={4}
            placeholder="Paste classroom text or directions…"
            value={visualText}
            onChange={(e) => setVisualText(e.target.value)}
          />
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-xl tint-sun p-3 text-sm leading-relaxed">
              <p className="text-[10px] font-bold uppercase">Large print</p>
              <p>{visualText || 'Your text appears here in larger type.'}</p>
            </div>
            <div className="rounded-xl tint-mint p-3 text-xs">
              <p className="text-[10px] font-bold uppercase">Para how-to</p>
              <p>
                1) Read one section at a time. 2) Check understanding. 3) Offer choice board if
                overwhelmed. 4) Log response in SOAP.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            onClick={() => {
              void navigator.clipboard.writeText(
                `LARGE PRINT / SIMPLIFIED\n\n${visualText}\n\nPARA: Read one section · check understanding · offer choice board.`,
              )
              flash('Copied simplified handout')
            }}
          >
            Copy simplified handout
          </button>
        </section>
      )}

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
    </PageShell>
  )
}
