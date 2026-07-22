import { useEffect, useState } from 'react'
import {
  formatCountdownBadge,
  nextCountdown,
  type CountdownTarget,
} from '../../lib/scheduling/calendarCountdown'

const TZ = 'America/Denver'

function formatParts(now: Date) {
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TZ,
  })
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZone: TZ,
  })
  return { date, time }
}

export function DashboardDateCountdown() {
  const [now, setNow] = useState(() => new Date())
  const [countdown, setCountdown] = useState<CountdownTarget | null>(() => nextCountdown())

  useEffect(() => {
    const tick = window.setInterval(() => {
      const n = new Date()
      setNow(n)
      // Refresh countdown at midnight locally
      if (n.getHours() === 0 && n.getMinutes() === 0 && n.getSeconds() < 2) {
        setCountdown(nextCountdown(n))
      }
    }, 1000)
    return () => window.clearInterval(tick)
  }, [])

  const { date, time } = formatParts(now)

  return (
    <section
      className="dashboard-clock mb-5 overflow-hidden rounded-3xl border border-amber-200/80 px-4 py-6 text-center shadow-card sm:px-8 sm:py-8"
      aria-live="polite"
    >
      <div className="dashboard-clock-glow" aria-hidden />
      <p className="dashboard-clock-date font-heading text-xl font-bold tracking-tight text-[var(--text)] sm:text-3xl md:text-4xl">
        {date}
      </p>
      <p className="dashboard-clock-time mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--accent)] sm:text-4xl md:text-5xl">
        {time}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--subtext)]">
        Mountain Time
      </p>
      {countdown && (
        <div className="mt-5 flex justify-center">
          <span
            className="countdown-badge-hero inline-flex items-center gap-2 rounded-full border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-100 to-amber-50 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-sm sm:px-7 sm:py-3 sm:text-lg md:text-xl"
            title={`${countdown.title} · ${countdown.start}${countdown.end !== countdown.start ? ` → ${countdown.end}` : ''}`}
          >
            <span className="countdown-emoji text-xl sm:text-2xl" aria-hidden>
              {countdown.emoji}
            </span>
            <span>{formatCountdownBadge(countdown).replace(countdown.emoji, '').trim()}</span>
          </span>
        </div>
      )}
    </section>
  )
}
