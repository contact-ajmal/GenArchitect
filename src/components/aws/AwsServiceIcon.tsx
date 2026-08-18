import clsx from 'clsx'

/**
 * Renders an official AWS Architecture Icon by file id from
 * src/assets/aws-icons/<iconId>.svg. If the asset is missing, it renders a
 * clean, clearly-generic fallback glyph (never an invented or approximated AWS
 * logo). Drop the official icons in and they light up automatically — see
 * src/assets/aws-icons/README.md for where to download them.
 */

// Eagerly collect whatever official icons have been added to the folder.
const ICON_URLS = import.meta.glob('../../assets/aws-icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const BY_ID = new Map<string, string>()
for (const [path, url] of Object.entries(ICON_URLS)) {
  const file = path.split('/').pop()?.replace(/\.svg$/, '')
  if (file) BY_ID.set(file, url)
}

/** A neutral service glyph — a generic "node" motif, not an AWS mark. */
function GenericGlyph({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.4" fill="currentColor" stroke="none" />
      <path d="M9 9 L15 15" />
    </svg>
  )
}

export interface AwsServiceIconProps {
  /** Icon file base name (src/assets/aws-icons/<iconId>.svg). */
  iconId: string
  /** Official service name — used as the accessible label. */
  name: string
  size?: number
  className?: string
}

export default function AwsServiceIcon({
  iconId,
  name,
  size = 24,
  className,
}: AwsServiceIconProps) {
  const url = BY_ID.get(iconId)

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className={clsx('inline-block object-contain', className)}
        loading="lazy"
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={clsx('inline-flex items-center justify-center text-ink-muted', className)}
      style={{ width: size, height: size }}
    >
      <GenericGlyph size={size} />
    </span>
  )
}
