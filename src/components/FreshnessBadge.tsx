import { ExternalLink, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import type { VerificationRecord } from '../data/verification'
import { volatilityLabel } from '../data/verification'

export interface FreshnessBadgeProps {
  verification: VerificationRecord
  className?: string
}

/**
 * Compact "verified against AWS docs · date" affordance. Volatile syntax gets a
 * more prominent amber treatment; stable/moderate stay quiet. Always links to
 * the canonical source so the reader can confirm.
 */
export default function FreshnessBadge({
  verification,
  className,
}: FreshnessBadgeProps) {
  const { volatility, lastVerified, sourceUrl } = verification
  const volatile = volatility === 'volatile'

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]',
        volatile ? 'text-amber-700' : 'text-ink-muted',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wide">
        <ShieldCheck className="h-3.5 w-3.5" />
        Verified against AWS docs · {lastVerified}
      </span>
      <span
        className={clsx(
          'rounded-full px-1.5 py-0.5 font-mono uppercase tracking-wide',
          volatile
            ? 'bg-amber-100 text-amber-800'
            : volatility === 'moderate'
              ? 'bg-neutral-100 text-ink-muted'
              : 'bg-neutral-100 text-ink-muted',
        )}
      >
        {volatilityLabel(volatility)}
      </span>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-medium text-accent-strong hover:underline"
      >
        Check current docs
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}
