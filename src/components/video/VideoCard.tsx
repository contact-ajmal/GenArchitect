import { Play, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import type { VideoEntry } from '../../types'
import { relativeTime } from '../../lib/videos'

export interface VideoCardProps {
  video: VideoEntry
  onOpen: (video: VideoEntry) => void
  compact?: boolean
}

/**
 * A video card. Shows the official thumbnail with a play affordance — it never
 * mounts an iframe (that happens only when opened in the player).
 */
export default function VideoCard({ video, onOpen, compact }: VideoCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(video)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-hairline bg-neutral-0 text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="relative block aspect-video w-full overflow-hidden bg-neutral-100">
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors group-hover:bg-ink/20">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-0/90 opacity-0 shadow transition-opacity group-hover:opacity-100">
            <Play className="h-5 w-5 fill-ink text-ink" />
          </span>
        </span>
        {video.duration ? (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-neutral-0">
            {video.duration}
          </span>
        ) : null}
        {video.trustTier === 'official' ? (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-navy/90 px-1.5 py-0.5 text-[10px] font-medium text-neutral-0">
            <ShieldCheck className="h-3 w-3 text-signal" />
            Official
          </span>
        ) : null}
      </span>

      <span className="flex flex-1 flex-col p-3">
        <span className={clsx('font-medium leading-snug text-ink', compact ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-[15px]')}>
          {video.title}
        </span>
        <span className="mt-1 text-xs text-ink-muted">
          {video.channelName} · {relativeTime(video.publishedAt)}
        </span>
        {!compact ? (
          <span className="mt-2 flex flex-wrap gap-1">
            {video.topics.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                {t}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  )
}
