import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import {
  BOARD_SIZE,
  CHANCE_CARDS,
  clampSpace,
  ensureStudent,
  loadGameState,
  saveGameState,
  type GameState,
} from '../../lib/motivation-game/store'

export function MotivationGamePage() {
  const { students } = useStudents()
  const [state, setState] = useState<GameState>(() => loadGameState())
  const [studentId, setStudentId] = useState('')
  const [dice, setDice] = useState<number | null>(null)
  const [card, setCard] = useState<(typeof CHANCE_CARDS)[number] | null>(null)
  const [toast, setToast] = useState('')

  const active = useMemo(() => {
    if (!studentId) return null
    return state.students.find((s) => s.studentId === studentId) || null
  }, [state, studentId])

  const student = students.find((s) => s.id === studentId)
  const today = new Date().toISOString().slice(0, 10)

  function persist(next: GameState) {
    setState(next)
    saveGameState(next)
  }

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function withStudent(mutator: (g: GameState) => GameState) {
    if (!studentId) {
      flash('Pick a student first')
      return
    }
    const base = ensureStudent(state, studentId)
    persist(mutator(base))
  }

  function checkInAttendance() {
    withStudent((g) => {
      const row = g.students.find((s) => s.studentId === studentId)!
      if (row.attendanceDates.includes(today)) {
        flash('Already checked in today')
        return { ...g, lastEvent: `${student?.name} already present today` }
      }
      const students = g.students.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              attendanceDates: [...s.attendanceDates, today],
              points: s.points + 2,
              boardSpace: clampSpace(s.boardSpace + 1, g.boardSize),
            }
          : s,
      )
      flash('+2 points for showing up!')
      return {
        ...g,
        students,
        lastEvent: `${student?.name} checked in — +2 pts, moved 1 space`,
      }
    })
  }

  function rollDice() {
    withStudent((g) => {
      const roll = Math.floor(Math.random() * 6) + 1
      setDice(roll)
      setCard(null)
      const students = g.students.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              boardSpace: clampSpace(s.boardSpace + roll, g.boardSize),
              points: s.points + roll,
            }
          : s,
      )
      const space = students.find((s) => s.studentId === studentId)!.boardSpace
      // Ladder / chute spaces
      let extra = ''
      let nextStudents = students
      if (space === 5 || space === 12) {
        nextStudents = students.map((s) =>
          s.studentId === studentId
            ? { ...s, boardSpace: clampSpace(s.boardSpace + 3, g.boardSize), points: s.points + 3 }
            : s,
        )
        extra = ' — climbed a ladder +3!'
      } else if (space === 9 || space === 18) {
        nextStudents = students.map((s) =>
          s.studentId === studentId
            ? { ...s, boardSpace: clampSpace(s.boardSpace - 2, g.boardSize) }
            : s,
        )
        extra = ' — chute! back 2 (keep trying)'
      }
      flash(`Rolled ${roll}${extra}`)
      return {
        ...g,
        students: nextStudents,
        lastEvent: `${student?.name} rolled ${roll}${extra}`,
      }
    })
  }

  function pullCard() {
    withStudent((g) => {
      const drawn = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)]
      setCard(drawn)
      setDice(null)
      const students = g.students.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              boardSpace: clampSpace(s.boardSpace + drawn.deltaSpace, g.boardSize),
              points: s.points + drawn.deltaPoints,
            }
          : s,
      )
      flash(drawn.text)
      return {
        ...g,
        students,
        lastEvent: `${student?.name}: ${drawn.text}`,
      }
    })
  }

  function claimPrize(prize: string) {
    withStudent((g) => {
      const row = g.students.find((s) => s.studentId === studentId)!
      if (row.points < 20) {
        flash('Need 20 points to claim a prize')
        return g
      }
      if (row.boardSpace < g.boardSize - 1 && row.points < 40) {
        flash('Reach the finish (or 40 pts) for mid-year prize picks — or keep earning!')
      }
      const students = g.students.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              points: s.points - 20,
              prizesClaimed: [...s.prizesClaimed, `${prize} (${today})`],
              boardSpace: s.boardSpace >= g.boardSize - 1 ? 0 : s.boardSpace,
            }
          : s,
      )
      flash(`Prize claimed: ${prize}`)
      return {
        ...g,
        students,
        lastEvent: `${student?.name} claimed ${prize}`,
      }
    })
  }

  const leaderboard = useMemo(() => {
    return [...state.students]
      .map((g) => ({
        ...g,
        name: students.find((s) => s.id === g.studentId)?.name || g.studentId,
      }))
      .sort((a, b) => b.points - a.points)
  }, [state.students, students])

  return (
    <PageShell
      title="🎲 Motivation Track"
      description="Candyland / Chutes-and-Ladders energy with ClassDojo-style points — attendance check-ins, dice, chance cards, and a year-long prize board. Ties into Progress Monitoring when kids show up and earn."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <Link to="/progress" className="font-semibold text-[var(--accent)]">
          Log a probe after the win →
        </Link>
        <Link to="/binder" className="font-semibold text-[var(--accent)]">
          Include in Caseload Binder PDF →
        </Link>
      </div>

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <label className="text-xs font-semibold">
          Player (student)
          <select
            className="mt-1 w-full max-w-sm rounded-lg border border-[var(--border)] px-2 py-2"
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value)
              if (e.target.value) persist(ensureStudent(state, e.target.value))
            }}
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {active && (
          <p className="mt-2 text-xs">
            <strong>{student?.name}</strong> · {active.points} points · space {active.boardSpace + 1}/
            {BOARD_SIZE} · attendance {active.attendanceDates.length} days
          </p>
        )}
        <p className="mt-1 text-[10px] text-[var(--subtext)]">{state.lastEvent}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"
            onClick={checkInAttendance}
          >
            ✓ Attendance check-in (+2)
          </button>
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
            onClick={rollDice}
          >
            🎲 Roll dice
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            onClick={pullCard}
          >
            🃏 Pull a card
          </button>
        </div>
        {(dice != null || card) && (
          <div className="mt-3 rounded-xl bg-[var(--slate)] p-3 text-sm font-bold">
            {dice != null && <span>Dice: {dice}</span>}
            {card && <span>{card.text}</span>}
          </div>
        )}
      </section>

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Board</h2>
        <div className="mt-3 grid grid-cols-6 gap-1 sm:grid-cols-8">
          {Array.from({ length: BOARD_SIZE }, (_, i) => {
            const here = active?.boardSpace === i
            const special =
              i === 5 || i === 12 ? 'ladder' : i === 9 || i === 18 ? 'chute' : i === BOARD_SIZE - 1 ? 'finish' : ''
            return (
              <div
                key={i}
                className={`flex h-10 items-center justify-center rounded-lg border text-[10px] font-bold ${
                  here
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : special === 'ladder'
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : special === 'chute'
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : special === 'finish'
                          ? 'border-purple-300 bg-purple-50 text-purple-900'
                          : 'border-[var(--border)] bg-[var(--slate)]'
                }`}
                title={special || `Space ${i + 1}`}
              >
                {i + 1}
                {special === 'ladder' ? '↑' : special === 'chute' ? '↓' : special === 'finish' ? '★' : ''}
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[10px] text-[var(--subtext)]">
          Green ↑ ladders · Amber ↓ chutes · ★ finish — then claim a prize from the board below.
        </p>
      </section>

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Year-long prize board (20 pts)</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {state.prizeOptions.map((p) => (
            <button
              key={p}
              type="button"
              className="rounded-xl border border-[var(--border)] bg-[var(--sky)] px-3 py-3 text-left text-xs font-semibold hover:border-[var(--accent)]"
              onClick={() => claimPrize(p)}
            >
              🎁 {p}
            </button>
          ))}
        </div>
        {active && active.prizesClaimed.length > 0 && (
          <p className="mt-3 text-xs text-[var(--subtext)]">
            Claimed: {active.prizesClaimed.join(' · ')}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Leaderboard</h2>
        <ul className="mt-2 space-y-1 text-xs">
          {!leaderboard.length && (
            <li className="text-[var(--subtext)]">No plays yet — check in a student to start.</li>
          )}
          {leaderboard.map((row, i) => (
            <li key={row.studentId} className="flex justify-between border-b border-[var(--border)] py-1">
              <span>
                {i + 1}. {row.name}
              </span>
              <span className="font-mono font-bold">
                {row.points} pts · day {row.boardSpace + 1}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
