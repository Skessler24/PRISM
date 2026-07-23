import { useEffect, useMemo, useRef, useState } from 'react'
import {
  formatCountdownBadge,
  nextCountdown,
  type CountdownTarget,
} from '../../lib/scheduling/calendarCountdown'
import {
  DENVER_COORDS,
  cacheWeather,
  fetchWeather,
  loadCachedWeather,
  type WeatherSnapshot,
} from '../../lib/weather/openMeteo'

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

/** Deterministic star field so layout stays stable. */
function buildStars(count: number) {
  const stars = []
  for (let i = 0; i < count; i++) {
    const left = ((i * 37) % 100) + (i % 7) * 0.3
    const delay = ((i * 0.47) % 8).toFixed(2)
    const duration = (4.5 + (i % 5) * 1.1).toFixed(2)
    const size = 1 + (i % 3)
    const drift = ((i * 13) % 40) - 20
    stars.push({ id: i, left, delay, duration, size, drift })
  }
  return stars
}

export function DashboardDateCountdown() {
  const [now, setNow] = useState(() => new Date())
  const [countdown, setCountdown] = useState<CountdownTarget | null>(() => nextCountdown())
  const [weather, setWeather] = useState<WeatherSnapshot | null>(() => loadCachedWeather())
  const [weatherNote, setWeatherNote] = useState('')
  const coordsRef = useRef({ ...DENVER_COORDS })
  const stars = useMemo(() => buildStars(28), [])

  useEffect(() => {
    const tick = window.setInterval(() => {
      const n = new Date()
      setNow(n)
      if (n.getHours() === 0 && n.getMinutes() === 0 && n.getSeconds() < 2) {
        setCountdown(nextCountdown(n))
      }
    }, 1000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    let cancelled = false

    async function load() {
      const { lat, lon, placeLabel } = coordsRef.current
      try {
        const snap = await fetchWeather(lat, lon, placeLabel, ac.signal)
        if (cancelled) return
        setWeather(snap)
        cacheWeather(snap)
        setWeatherNote('')
      } catch {
        if (!cancelled && !loadCachedWeather()) setWeatherNote('Weather offline')
      }
    }

    function startDenver() {
      coordsRef.current = { ...DENVER_COORDS }
      void load()
    }

    if (!navigator.geolocation) {
      startDenver()
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coordsRef.current = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            placeLabel: 'Near you',
          }
          void load()
        },
        () => startDenver(),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 30 * 60 * 1000 },
      )
    }

    const refresh = window.setInterval(() => void load(), 30 * 60 * 1000)
    return () => {
      cancelled = true
      ac.abort()
      window.clearInterval(refresh)
    }
  }, [])

  const { date, time } = formatParts(now)

  return (
    <section
      className="dashboard-clock dashboard-galaxy mb-5 overflow-hidden rounded-3xl border border-indigo-400/30 px-4 py-6 text-center shadow-card sm:px-8 sm:py-8"
      aria-live="polite"
    >
      <div className="galaxy-nebula" aria-hidden />
      <div className="galaxy-stars-static" aria-hidden />
      <div className="galaxy-falling-stars" aria-hidden>
        {stars.map((s) => (
          <span
            key={s.id}
            className="falling-star"
            style={{
              left: `${s.left}%`,
              width: s.size,
              height: s.size * 10,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              ['--star-drift' as string]: `${s.drift}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-[1]">
        <p className="dashboard-clock-date font-heading text-xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
          {date}
        </p>
        <p className="dashboard-clock-time mt-2 font-mono text-2xl font-semibold tabular-nums text-violet-200 sm:text-4xl md:text-5xl">
          {time}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200/80">
          Mountain Time
        </p>

        <div className="mt-4 flex justify-center">
          {weather ? (
            <div
              className="galaxy-weather inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-indigo-50 backdrop-blur-sm sm:gap-3 sm:px-5"
              title={`Updated ${new Date(weather.updatedAt).toLocaleTimeString('en-US', { timeZone: TZ })}`}
            >
              <span className="text-lg" aria-hidden>
                {weather.emoji}
              </span>
              <span className="font-mono text-lg font-bold tabular-nums sm:text-xl">
                {weather.tempF}°F
              </span>
              <span className="text-xs font-semibold text-indigo-100/90 sm:text-sm">
                {weather.label}
                {weather.feelsLikeF != null ? ` · feels ${weather.feelsLikeF}°` : ''}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-indigo-200/70">
                {weather.placeLabel}
                {weather.windMph != null ? ` · wind ${weather.windMph} mph` : ''}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-indigo-200/70">
              {weatherNote || 'Loading weather…'}
            </p>
          )}
        </div>

        {countdown && (
          <div className="mt-5 flex justify-center">
            <span
              className="countdown-badge-hero inline-flex items-center gap-2 rounded-full border border-violet-300/40 bg-gradient-to-r from-indigo-500/40 via-violet-500/35 to-fuchsia-500/30 px-5 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur-sm sm:px-7 sm:py-3 sm:text-lg md:text-xl"
              title={`${countdown.title} · ${countdown.start}${countdown.end !== countdown.start ? ` → ${countdown.end}` : ''}`}
            >
              <span className="countdown-emoji text-xl sm:text-2xl" aria-hidden>
                {countdown.emoji}
              </span>
              <span>{formatCountdownBadge(countdown).replace(countdown.emoji, '').trim()}</span>
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
