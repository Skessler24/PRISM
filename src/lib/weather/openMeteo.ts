/** Open-Meteo weather (no API key). Defaults to Denver metro for CCSD. */

export type WeatherSnapshot = {
  tempF: number
  feelsLikeF: number | null
  weatherCode: number
  windMph: number | null
  label: string
  emoji: string
  placeLabel: string
  updatedAt: string
}

/** Cherry Creek / Denver metro fallback */
export const DENVER_COORDS = {
  lat: 39.7392,
  lon: -104.9903,
  placeLabel: 'Denver metro',
}

/** WMO weather interpretation codes → short label + emoji */
export function describeWeatherCode(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Clear', emoji: '✨' }
  if (code === 1) return { label: 'Mostly clear', emoji: '🌙' }
  if (code === 2) return { label: 'Partly cloudy', emoji: '⛅' }
  if (code === 3) return { label: 'Overcast', emoji: '☁️' }
  if (code === 45 || code === 48) return { label: 'Foggy', emoji: '🌫️' }
  if (code >= 51 && code <= 57) return { label: 'Drizzle', emoji: '🌦️' }
  if (code >= 61 && code <= 67) return { label: 'Rain', emoji: '🌧️' }
  if (code >= 71 && code <= 77) return { label: 'Snow', emoji: '❄️' }
  if (code >= 80 && code <= 82) return { label: 'Showers', emoji: '🌦️' }
  if (code >= 85 && code <= 86) return { label: 'Snow showers', emoji: '🌨️' }
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', emoji: '⛈️' }
  return { label: 'Local conditions', emoji: '🌌' }
}

type OpenMeteoCurrent = {
  temperature_2m?: number
  apparent_temperature?: number
  weather_code?: number
  wind_speed_10m?: number
}

export async function fetchWeather(
  lat: number,
  lon: number,
  placeLabel: string,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
  )
  url.searchParams.set('temperature_unit', 'fahrenheit')
  url.searchParams.set('wind_speed_unit', 'mph')
  url.searchParams.set('timezone', 'America/Denver')

  const res = await fetch(url.toString(), { signal })
  if (!res.ok) throw new Error(`Weather unavailable (${res.status})`)
  const data = (await res.json()) as { current?: OpenMeteoCurrent }
  const cur = data.current || {}
  const code = typeof cur.weather_code === 'number' ? cur.weather_code : 0
  const { label, emoji } = describeWeatherCode(code)
  const tempF = Math.round(cur.temperature_2m ?? 0)
  return {
    tempF,
    feelsLikeF:
      typeof cur.apparent_temperature === 'number'
        ? Math.round(cur.apparent_temperature)
        : null,
    weatherCode: code,
    windMph:
      typeof cur.wind_speed_10m === 'number' ? Math.round(cur.wind_speed_10m) : null,
    label,
    emoji,
    placeLabel,
    updatedAt: new Date().toISOString(),
  }
}

export function loadCachedWeather(): WeatherSnapshot | null {
  try {
    const raw = localStorage.getItem('prism_dashboard_weather_v1')
    if (!raw) return null
    const parsed = JSON.parse(raw) as WeatherSnapshot & { cachedAt?: string }
    const cachedAt = parsed.cachedAt ? Date.parse(parsed.cachedAt) : 0
    if (!cachedAt || Date.now() - cachedAt > 30 * 60 * 1000) return null
    return parsed
  } catch {
    return null
  }
}

export function cacheWeather(snap: WeatherSnapshot) {
  try {
    localStorage.setItem(
      'prism_dashboard_weather_v1',
      JSON.stringify({ ...snap, cachedAt: new Date().toISOString() }),
    )
  } catch {
    /* ignore quota */
  }
}
