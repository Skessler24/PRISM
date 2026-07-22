/** Register PRISM shell service worker (PWA). Safe no-op if unsupported. */
export function registerPrismServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  // Dev: skip SW so Vite HMR stays clean
  if (import.meta.env.DEV) return

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore — offline install is optional */
    })
  })
}
