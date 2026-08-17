import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional eyebrow slot rendered above the card body. */
  eyebrow?: ReactNode
  children: ReactNode
}

/** Surface primitive: hairline border, generous padding, optional eyebrow. */
export default function Card({
  eyebrow,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-hairline bg-neutral-0 p-6 sm:p-7',
        className,
      )}
      {...props}
    >
      {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
      {children}
    </div>
  )
}
