import { useEffect, useRef } from 'react'
import { ExternalLink, X } from 'lucide-react'
import type { VideoEntry } from '../../types'
import { relativeTime } from '../../lib/videos'
import { Pill } from '../ui'

export interface VideoPlayerProps {
  video: VideoEntry | null
  onClose: () => void
}

/**
 * Opens a video in a focus-trapped modal (a full-height sheet on mobile). The
 * YouTube iframe is mounted ONLY here, on open, using the privacy-preserving
 * youtube-nocookie.com player — never on grid render. We embed and link back;
 * we never proxy, download, or re-host video.
 */
export default function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!video) return
    returnFocus.current = document.activeElement as HTMLElement
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnFocus.current?.focus?.()
    }
  }, [video, onClose])

  if (!video) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-stretch justify-center bg-ink/60 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="flex w-full max-w-3xl flex-col overflow-hidden bg-neutral-0 focus:outline-none sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-hairline"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
          <p className="min-w-0 truncate text-sm font-medium text-ink">{video.channelName}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-ink-muted hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lazy iframe — mounted only now, on the nocookie domain. */}
        <div className="aspect-video w-full bg-ink">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div className="overflow-auto p-4">
          <h2 className="font-display text-lg font-semibold text-ink">{video.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {video.channelName} · {relativeTime(video.publishedAt)}
            {video.duration ? ` · ${video.duration}` : ''}
          </p>
          {video.summary ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{video.summary}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {video.topics.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
          >
            Watch on YouTube
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
