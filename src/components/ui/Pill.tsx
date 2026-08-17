import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export type PillVariant =
  | 'neutral'
  | 'aws'
  | 'managed'
  | 'self-managed'
  | 'difficulty'

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant
  /** Optional leading icon (e.g. a lucide icon element). */
  icon?: ReactNode
  children: ReactNode
}

const VARIANTS: Record<PillVariant, string> = {
  neutral: 'bg-neutral-100 text-ink-soft border-neutral-200',
  // AWS service labels — evoke the AWS orange without shouting.
  aws: 'bg-amber-50 text-amber-700 border-amber-200',
  // Fully-managed offerings — the calm accent teal.
  managed: 'bg-accent/10 text-accent-strong border-accent/30',
  // Self-managed / roll-your-own — a cooler slate.
  'self-managed': 'bg-slate-100 text-slate-700 border-slate-200',
  // Difficulty ratings.
  difficulty: 'bg-violet-50 text-violet-700 border-violet-200',
}

/** Compact metadata tag used for AWS services, ownership, and difficulty. */
export default function Pill({
  variant = 'neutral',
  icon,
  className,
  children,
  ...props
}: PillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'font-mono text-[11px] font-medium tracking-tight',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {icon ? <span className="shrink-0 [&>svg]:h-3 [&>svg]:w-3">{icon}</span> : null}
      {children}
    </span>
  )
}
