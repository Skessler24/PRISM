import { useTheme } from '../app/theme-context'

export function ThemeStudioModal() {
  const { themeStudioOpen, setThemeStudioOpen, families, familyId, paletteName, setTheme } =
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
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--card-bg)] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-[var(--text)]">Theme Studio</h2>
            <p className="text-sm text-[var(--subtext)]">
              Ported from the PRISM Vision Board — pick a family and palette.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm"
            onClick={() => setThemeStudioOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          {families.map((family) => (
            <section key={family.id}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: family.dot }}
                />
                <h3 className="font-heading text-sm font-bold text-[var(--text)]">{family.name}</h3>
              </div>
              <p className="mb-2 text-xs text-[var(--subtext)]">{family.vibe}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {family.palettes.map((palette) => {
                  const selected = family.id === familyId && palette.name === paletteName
                  return (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => setTheme(family.id, palette.name)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]'
                          : 'border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <div className="mb-2 flex gap-1">
                        {[palette.primary, palette.accent, palette.header.startsWith('linear') ? palette.bg : palette.header, palette.bg].map(
                          (c, i) => (
                            <span
                              key={`${palette.name}-${i}`}
                              className="h-5 w-5 rounded-full border border-black/5"
                              style={{ background: c }}
                            />
                          ),
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[var(--text)]">{palette.name}</p>
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
