import { useTheme } from '../app/theme-context'

export function ThemeStudioModal() {
  const { themeStudioOpen, setThemeStudioOpen, families, familyId, paletteName, setTheme, family } =
    useTheme()

  if (!themeStudioOpen) return null

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close theme studio"
        onClick={() => setThemeStudioOpen(false)}
      />
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-[var(--text)]">Theme Studio</h2>
            <p className="text-sm text-[var(--subtext)]">
              Vision Board v2.1 · {family.name} / {paletteName}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm text-[var(--text)]"
            onClick={() => setThemeStudioOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {families.map((f) => {
            const active = f.id === familyId
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setTheme(f.id, f.palettes[0].name)}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  border: `2px solid ${active ? f.dot : 'transparent'}`,
                  background: active ? `${f.dot}14` : 'var(--slate)',
                  color: active ? f.dot : 'var(--text)',
                  boxShadow: active ? `0 0 0 3px ${f.dot}25` : undefined,
                }}
              >
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: f.dot }}
                />
                {f.name}
              </button>
            )
          })}
        </div>

        <div className="space-y-5">
          {families.map((f) => (
            <section key={f.id} className={f.id === familyId ? '' : 'opacity-60'}>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: f.dot }}
                />
                <h3 className="font-heading text-sm font-bold text-[var(--text)]">{f.name}</h3>
                <span className="text-[10px] text-[var(--subtext)]">
                  {f.fontPrimaryName} / {f.fontSecondaryName}
                </span>
              </div>
              <p className="mb-2 text-xs text-[var(--subtext)]">{f.vibe}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {f.palettes.map((palette) => {
                  const selected = f.id === familyId && palette.name === paletteName
                  return (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => setTheme(f.id, palette.name)}
                      className="rounded-xl border p-3 text-left transition"
                      style={{
                        borderColor: selected ? palette.primary : 'var(--border)',
                        boxShadow: selected ? `0 0 0 3px ${palette.primary}33` : undefined,
                        background: 'var(--card-bg)',
                      }}
                    >
                      <div className="mb-2 flex gap-1">
                        {[
                          palette.primary,
                          palette.accent,
                          palette.header.startsWith('linear') ? palette.bg : palette.header,
                          palette.bg,
                          palette.card,
                        ].map((c, i) => (
                          <span
                            key={`${palette.name}-${i}`}
                            className="h-6 w-6 rounded-full border border-black/10"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-semibold text-[var(--text)]">{palette.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-[var(--subtext)]">
                        {palette.primary} · {palette.bg}
                      </p>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
