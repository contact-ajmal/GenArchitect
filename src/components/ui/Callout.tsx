import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CircleDollarSign,
  Info,
  Lightbulb,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'

export type CalloutVariant = 'note' | 'tip' | 'warning' | 'security' | 'cost'

export interface CalloutProps {
  variant?: CalloutVariant
  title?: ReactNode
  children: ReactNode
  className?: string
}

type CalloutStyle = {
  Icon: LucideIcon
  /** border + background classes for the container */
  container: string
  /** icon color class */
  iconColor: string
  label: string
}

const STYLES: Record<CalloutVariant, CalloutStyle> = {
  note: {
    Icon: Info,
    container: 'bg-neutral-50 border-neutral-200 border-l-neutral-400',
    iconColor: 'text-ink-muted',
    label: 'Note',
  },
  tip: {
    Icon: Lightbulb,
    container: 'bg-accent/[0.06] border-accent/20 border-l-accent',
    iconColor: 'text-accent-strong',
    label: 'Tip',
  },
  warning: {
    Icon: AlertTriangle,
    container: 'bg-amber-50 border-amber-200 border-l-amber-400',
    iconColor: 'text-amber-600',
    label: 'Warning',
  },
  security: {
    Icon: ShieldCheck,
    container: 'bg-indigo-50 border-indigo-200 border-l-indigo-400',
    iconColor: 'text-indigo-600',
    label: 'Security',
  },
  cost: {
    Icon: CircleDollarSign,
    container: 'bg-emerald-50 border-emerald-200 border-l-emerald-500',
    iconColor: 'text-emerald-600',
    label: 'Cost',
  },
}

/**
 * Restrained, icon-led callout for enterprise tradeoffs and "verify against
 * current AWS docs" flags. Five variants, each with its own color and icon.
 */
export default function Callout({
  variant = 'note',
  title,
  children,
  className,
}: CalloutProps) {
  const { Icon, container, iconColor, label } = STYLES[variant]

  return (
    <div
      className={clsx('rounded-lg border border-l-4 p-4 pl-3.5', container, className)}
      role="note"
    >
      <div className="flex gap-3">
        <Icon
          className={clsx('mt-0.5 h-5 w-5 shrink-0', iconColor)}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{title ?? label}</p>
          <div className="mt-1 text-sm leading-relaxed text-ink-soft [&_a]:text-accent-strong [&_a]:underline">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
