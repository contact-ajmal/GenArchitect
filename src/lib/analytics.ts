/**
 * Lightweight, database-free analytics.
 *
 * Page views (incl. client-side route changes — Cloudflare's beacon has
 * built-in SPA/History-API support) are captured by Cloudflare Web Analytics,
 * which is free, cookieless, and needs no backend of ours. The beacon only
 * loads when a token is configured, so nothing runs (or breaks) when it isn't.
 *
 * Configure the token via the build-time env var VITE_CF_BEACON_TOKEN:
 *   - locally:      add it to .env
 *   - in production: Cloudflare Pages → Settings → Environment variables
 * The beacon token is NOT a secret (it ships in client HTML for every visitor),
 * so it's safe to expose in the built bundle.
 */

const CF_TOKEN = import.meta.env.VITE_CF_BEACON_TOKEN as string | undefined

let injected = false

/** Inject the Cloudflare Web Analytics beacon once, if a token is set. */
export function initAnalytics(): void {
  if (injected) return
  if (typeof document === 'undefined') return
  if (!CF_TOKEN) return // no token → no-op (e.g. local dev without config)

  injected = true
  const s = document.createElement('script')
  s.defer = true
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  // spa:true tells the beacon to count History-API navigations as page views.
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_TOKEN, spa: true }))
  document.head.appendChild(s)
}

/**
 * Record a custom event (e.g. "video_open", "notebook_download").
 *
 * Provider-agnostic and always safe: it forwards to a GA4/GTM-style dataLayer
 * or gtag if one exists, and no-ops otherwise (Cloudflare Web Analytics' free
 * tier tracks page views, not custom events — so these are captured only once
 * you add a provider that ingests them). In dev it logs to the console so you
 * can see events firing.
 */
export function track(name: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return

  const w = window as unknown as {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }

  if (typeof w.gtag === 'function') {
    w.gtag('event', name, props ?? {})
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: name, ...props })
  } else if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', name, props ?? {})
  }
}
