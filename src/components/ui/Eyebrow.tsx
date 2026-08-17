import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

/** Mono, uppercase micro-label used to introduce sections and cards. */
export default function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <span
      className={clsx(
        'font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
