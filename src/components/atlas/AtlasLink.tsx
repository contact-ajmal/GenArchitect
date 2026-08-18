import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import clsx from 'clsx'
import type { AtlasId } from '../../atlas/types'

export interface AtlasLinkProps {
  atlas: AtlasId
  topicId: string
  children: React.ReactNode
  className?: string
}

/**
 * A consistent, recognizable reference into an atlas topic — "learn the
 * concept". Using this everywhere keeps concept explanations in one place (the
 * atlases) with references pointing back to them.
 */
export default function AtlasLink({ atlas, topicId, children, className }: AtlasLinkProps) {
  return (
    <Link
      to={`/${atlas}/${topicId}`}
      className={clsx(
        'inline-flex items-center gap-1 rounded-md border border-hairline bg-neutral-50 px-1.5 py-0.5 text-xs font-medium text-accent-strong transition-colors hover:border-accent hover:bg-accent/[0.06]',
        className,
      )}
    >
      <Compass className="h-3 w-3" />
      {children}
    </Link>
  )
}
