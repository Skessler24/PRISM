/** Chronological age from birth date — useful for IEP / eval age checks. */

export type AgeParts = {
  years: number
  months: number
  days: number
  totalDays: number
  label: string
}

export function calculateAge(birthIso: string, asOfIso?: string): AgeParts | null {
  if (!birthIso) return null
  const birth = parseLocal(birthIso)
  const asOf = parseLocal(asOfIso || new Date().toISOString().slice(0, 10))
  if (!birth || !asOf || asOf < birth) return null

  let years = asOf.getFullYear() - birth.getFullYear()
  let months = asOf.getMonth() - birth.getMonth()
  let days = asOf.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const totalDays = Math.round((asOf.getTime() - birth.getTime()) / 86400000)
  const label = `${years} years, ${months} months, ${days} days`
  return { years, months, days, totalDays, label }
}

function parseLocal(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
