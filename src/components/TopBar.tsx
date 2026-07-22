import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useHelpAssist } from '../lib/help-assist/help-assist-context'
import { useTheme } from '../app/theme-context'
import { useAdminRole } from '../lib/admin/admin-role-context'
import { useMeetingSession } from '../lib/meeting-session/meeting-session-context'

export function TopBar() {
  const { enabled, toggle } = useHelpAssist()
  const { setThemeStudioOpen } = useTheme()
  const { isAdmin, unlockAdmin, setStaff, role } = useAdminRole()
  const { openMeetingSession } = useMeetingSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  function requestAdmin() {
    const code = window.prompt(
      'Admin access is for district configuration only.\nEnter admin code:',
    )
    if (code == null) return
    if (unlockAdmin(code)) {
      setMenuOpen(false)
      navigate('/district')
    } else {
      window.alert('Incorrect admin code.')
    }
  }

  return (
    <header
      className="shell-topbar fixed inset-x-0 top-0 z-[1000] flex items-center justify-between px-3 md:px-4"
      style={{ background: 'var(--header-bg)', color: 'var(--header-txt)' }}
    >
      <NavLink to="/" className="flex min-w-0 items-center gap-2" aria-label="PRISM home">
        <img
          src="/prism-wordmark.png"
          alt="PRISM — Reflect the Whole Human"
          className="h-11 w-auto max-w-[min(58vw,320px)] object-contain object-left sm:h-[56px] sm:max-w-[min(72vw,380px)]"
        />
      </NavLink>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
        <button
          type="button"
          onClick={() => openMeetingSession({ title: 'Team meeting' })}
          className="touch-manipulation rounded-lg border border-white/30 bg-white/10 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/20 sm:px-3 sm:py-1 sm:text-xs"
          title="Recordable team meeting — timer, agenda, summarize"
        >
          <span className="sm:hidden">⏱</span>
          <span className="hidden sm:inline">⏱ Meeting Timer</span>
        </button>
        <button
          type="button"
          onClick={toggle}
          className={`touch-manipulation rounded-full border-2 px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:py-1 sm:text-xs ${
            enabled
              ? 'border-green-500 bg-green-950 text-green-400'
              : 'border-gray-500 bg-transparent text-gray-300'
          }`}
          aria-pressed={enabled}
          aria-label={`Help Assist ${enabled ? 'on' : 'off'}`}
        >
          <span className="sm:hidden">💡 {enabled ? 'ON' : 'OFF'}</span>
          <span className="hidden sm:inline">💡 Help Assist: {enabled ? 'ON' : 'OFF'}</span>
        </button>
        <button
          type="button"
          onClick={() => setThemeStudioOpen(true)}
          className="touch-manipulation rounded-lg border border-white/30 bg-white/10 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-white/20 sm:px-3 sm:py-1 sm:text-xs"
        >
          Theme
        </button>

        <div className="relative">
          <button
            type="button"
            className="flex h-11 min-w-11 touch-manipulation items-center justify-center gap-1 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 px-2 text-sm font-bold text-white sm:h-9 sm:min-w-0"
            title="Account / Admin"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            SK
            <span className="hidden text-[10px] font-semibold uppercase sm:inline">
              {role === 'admin' ? 'Admin' : 'Staff'}
            </span>
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-[1001]"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-[1002] mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-2 text-[var(--text)] shadow-xl">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase text-[var(--subtext)]">
                  Role: {isAdmin ? 'Admin' : 'Staff'}
                </p>
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      className="block w-full rounded-lg px-2 py-2.5 text-left text-xs font-semibold hover:bg-[var(--slate)]"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/district')
                      }}
                    >
                      ⚙️ District Admin
                    </button>
                    <button
                      type="button"
                      className="block w-full rounded-lg px-2 py-2.5 text-left text-xs font-semibold hover:bg-[var(--slate)]"
                      onClick={() => {
                        setStaff()
                        setMenuOpen(false)
                      }}
                    >
                      Switch to Staff view
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="block w-full rounded-lg px-2 py-2.5 text-left text-xs font-semibold hover:bg-[var(--slate)]"
                    onClick={requestAdmin}
                  >
                    Admin access…
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
