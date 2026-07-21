import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  applyTally,
  getFbaSession,
  subscribeFbaLive,
  tallyTotal,
  type FbaSession,
} from '../../lib/fba/store'

/** Compact +/- pop-out for Smart TV / provider session — syncs live into the FBA sheet. */
export function FbaTallyPopoutPage() {
  const { sessionId: paramId = '' } = useParams()
  const [params] = useSearchParams()
  const sessionId = paramId || params.get('session') || ''
  const sessionStart = useMemo(() => new Date().toISOString(), [])
  const [session, setSession] = useState<FbaSession | null>(() => getFbaSession(sessionId) || null)

  useEffect(() => {
    const refresh = () => setSession(getFbaSession(sessionId) || null)
    refresh()
    return subscribeFbaLive(refresh)
  }, [sessionId])

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 p-4 text-white">
        <p className="text-sm">No open FBA session in this browser.</p>
        <Link to="/fba" className="text-sky-300 underline">
          Open FBA / BIP
        </Link>
      </div>
    )
  }

  const total = tallyTotal(session)

  function bump(delta: number) {
    const current = getFbaSession(sessionId)
    if (!current) return
    const next = applyTally(sessionId, delta, {
      sessionStart,
      goalLabel: current.targetBehavior,
    })
    if (next) setSession(next)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-white">
      <p className="mb-1 text-xs uppercase tracking-wide text-sky-300">Live FBA tally</p>
      <h1 className="mb-1 max-w-sm text-center text-lg font-bold">{session.studentName}</h1>
      <p className="mb-4 max-w-sm text-center text-sm text-white/70">{session.targetBehavior}</p>
      <p className="mb-6 font-mono text-7xl font-black text-amber-300">{total}</p>
      <div className="flex gap-6">
        <button
          type="button"
          className="h-28 w-28 rounded-full bg-rose-600 text-5xl font-black shadow-2xl active:scale-95"
          onClick={() => bump(-1)}
        >
          −
        </button>
        <button
          type="button"
          className="h-28 w-28 rounded-full bg-emerald-500 text-5xl font-black shadow-2xl active:scale-95"
          onClick={() => bump(1)}
        >
          +
        </button>
      </div>
      <p className="mt-6 text-center text-[11px] text-white/50">
        Date/time + tallies write to the FBA ABC sheet live (same browser / BroadcastChannel).
      </p>
      <Link to={`/fba?session=${session.id}`} className="mt-3 text-xs text-sky-300 underline">
        Open full FBA sheet
      </Link>
    </div>
  )
}
