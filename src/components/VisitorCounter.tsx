import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

/**
 * A lightweight, database-free visitor counter for the hero.
 *
 * Uses Abacus (https://abacus.jasoncameron.dev) — a free, no-auth hit counter.
 * We increment once per browser session (sessionStorage guard) and otherwise
 * just read the current total, so re-renders / SPA route changes don't inflate
 * it. If the service is unreachable the component renders NOTHING — it can
 * never break the page. This count is independent of Cloudflare Web Analytics
 * (which remains your accurate, private dashboard).
 *
 * To swap providers later, only BASE/NS/KEY and the response field need changing.
 */
const BASE = 'https://abacus.jasoncameron.dev'
const NS = 'genarchitect-pages-dev'
const KEY = 'site-visits'
const SESSION_FLAG = 'ga_visit_counted'

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const counted = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_FLAG)
    // First visit this session → /hit (increments). Otherwise → /get (read-only).
    const url = counted ? `${BASE}/get/${NS}/${KEY}` : `${BASE}/hit/${NS}/${KEY}`

    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('counter unavailable'))))
      .then((data: { value?: number }) => {
        if (cancelled) return
        if (!counted) {
          try {
            sessionStorage.setItem(SESSION_FLAG, '1')
          } catch {
            /* private mode / storage disabled — ignore */
          }
        }
        if (typeof data.value === 'number') setCount(data.value)
      })
      .catch(() => {
        /* offline or service down → stay hidden */
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (count === null) return null

  return (
    <span
      className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-0/15 bg-neutral-0/5 px-3 py-1 text-xs font-medium text-neutral-200"
      title="Total visits to GenArchitect"
    >
      <Eye className="h-3.5 w-3.5 text-signal" aria-hidden />
      <span className="font-mono tabular-nums text-neutral-0">{count.toLocaleString()}</span>
      <span className="text-neutral-300">visits</span>
    </span>
  )
}
